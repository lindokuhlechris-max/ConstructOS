import React from 'react';
import { EmployeesModule } from '../components/modules/EmployeesModule';

export function Employees() {
  return (
    <div className="p-4 md:p-6 overflow-y-auto h-full w-full">
      <EmployeesModule />
    </div>
  );
}
