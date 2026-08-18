export interface DriveBackupFile {
  id: string;
  name: string;
  createdTime?: string;
  size?: string;
}

export class GoogleDriveService {
  private readonly defaultFileName = 'constructfield_data.json';

  public static getClientId(): string {
    const raw = import.meta.env.VITE_GOOGLE_CLIENT_ID || 
      localStorage.getItem('constructfield_google_client_id') || 
      localStorage.getItem('constructos_google_client_id') || '';
    return raw.trim();
  }

  public static isClientIdValid(id?: string): boolean {
    const target = (id !== undefined ? id : GoogleDriveService.getClientId()).trim();
    return target.length > 15 && target.includes('.apps.googleusercontent.com');
  }

  public static saveClientId(id: string): void {
    const cleanId = id.trim();
    if (cleanId) {
      localStorage.setItem('constructfield_google_client_id', cleanId);
    } else {
      localStorage.removeItem('constructfield_google_client_id');
      localStorage.removeItem('constructos_google_client_id');
    }
  }

  private async ensureGoogleScriptLoaded(): Promise<void> {
    if (window.google?.accounts?.oauth2) return;

    return new Promise((resolve, reject) => {
      const existingScript = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
      if (existingScript) {
        let attempts = 0;
        const interval = setInterval(() => {
          attempts++;
          if (window.google?.accounts?.oauth2) {
            clearInterval(interval);
            resolve();
          } else if (attempts > 30) {
            clearInterval(interval);
            reject(new Error('Google Identity Services timed out loading.'));
          }
        }, 100);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        let attempts = 0;
        const interval = setInterval(() => {
          attempts++;
          if (window.google?.accounts?.oauth2) {
            clearInterval(interval);
            resolve();
          } else if (attempts > 20) {
            clearInterval(interval);
            resolve();
          }
        }, 50);
      };
      script.onerror = () => reject(new Error('Failed to load Google Identity Services. Check your internet connection.'));
      document.head.appendChild(script);
    });
  }

  private async getToken(): Promise<string> {
    await this.ensureGoogleScriptLoaded();

    return new Promise((resolve, reject) => {
      if (!window.google?.accounts?.oauth2) {
        reject(new Error('Google Identity Services not loaded. Please check your internet connection and try again.'));
        return;
      }
      
      const clientId = GoogleDriveService.getClientId();
      if (!clientId) {
        reject(new Error('Google OAuth Client ID is not configured. Please enter your Google OAuth 2.0 Web Client ID in Settings → System & Backup, or use Cloud Sync.'));
        return;
      }

      if (!GoogleDriveService.isClientIdValid(clientId)) {
        reject(new Error(`Invalid Google Client ID format ("${clientId}"). A valid Google OAuth 2.0 Web Client ID must end with ".apps.googleusercontent.com".`));
        return;
      }

      try {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.appdata',
          callback: (response: any) => {
            if (response.error !== undefined) {
              const errCode = response.error;
              const errDesc = response.error_description || '';
              if (errCode === 'invalid_client' || errCode === 'unauthorized_client') {
                reject(new Error(`Google OAuth error (${errCode}): The OAuth Client ID "${clientId.slice(0, 15)}..." was not found or origin "${window.location.origin}" is not authorized in Google Cloud Console.`));
              } else {
                reject(new Error(errDesc || errCode || 'Google Authentication was cancelled or failed.'));
              }
              return;
            }
            resolve(response.access_token);
          },
        });
        client.requestAccessToken();
      } catch (err: any) {
        reject(new Error(err?.message || 'Failed to initialize Google OAuth Token Client.'));
      }
    });
  }

  public async listFiles(onStatus?: (msg: string) => void): Promise<DriveBackupFile[]> {
    if (onStatus) onStatus('Connecting to Google Drive...');
    const token = await this.getToken();

    if (onStatus) onStatus('Searching Drive backups...');
    const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=(name contains 'constructfield' or name contains 'constructos') and trashed=false&fields=files(id, name, createdTime, size)&orderBy=createdTime desc`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) throw new Error('Failed to query Drive for backup files.');
    const data = await res.json();
    return data.files || [];
  }

  private async getFileId(token: string, fileName: string): Promise<string | null> {
    const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=name='${fileName}' and trashed=false&orderBy=createdTime desc`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!res.ok) throw new Error('Failed to query Drive for existing files.');
    
    const data = await res.json();
    if (data.files && data.files.length > 0) {
      return data.files[0].id;
    }
    return null;
  }

  public async writeData(data: any, fileName: string = this.defaultFileName, onStatus?: (msg: string) => void): Promise<void> {
    if (onStatus) onStatus('Connecting to Google Drive...');
    const token = await this.getToken();
    
    if (onStatus) onStatus('Checking for existing backup file...');
    const existingFileId = await this.getFileId(token, fileName);
    
    if (onStatus) onStatus('Preparing database snapshot...');
    const fileContent = JSON.stringify(data, null, 2);
    
    const metadata = {
      name: fileName,
      mimeType: 'application/json',
      description: `Scedih Full System Backup (${new Date().toLocaleString()})`
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', new Blob([fileContent], { type: 'application/json' }));

    if (onStatus) onStatus(existingFileId ? 'Updating existing backup in Drive...' : 'Uploading new backup file to Drive...');
    
    const url = existingFileId 
      ? `https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=multipart`
      : 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
      
    const method = existingFileId ? 'PATCH' : 'POST';

    const res = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: form
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      throw new Error(`Failed to upload file to Google Drive (${res.statusText}): ${errBody}`);
    }

    if (onStatus) onStatus('Backup successfully uploaded to Google Drive!');
  }

  public async readData(fileName: string = this.defaultFileName, onStatus?: (msg: string) => void): Promise<any> {
    if (onStatus) onStatus('Connecting to Google Drive...');
    const token = await this.getToken();
    
    if (onStatus) onStatus('Finding backup file on Drive...');
    const fileId = await this.getFileId(token, fileName);
    
    if (!fileId) {
      throw new Error(`No file named "${fileName}" found in Google Drive.`);
    }
    
    if (onStatus) onStatus('Downloading backup data...');
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!res.ok) {
      throw new Error('Failed to download file from Google Drive.');
    }
    
    return await res.json();
  }
}
