import { Outlet } from 'react-router-dom';

const AuthLayout = () => {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-primary-600 to-primary-800">
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold text-white mb-2">
              Cultural Heritage DAM
            </h1>
            <p className="text-primary-100">
              Digital Asset Management System
            </p>
          </div>

          <div className="card p-8 bg-white">
            <Outlet />
          </div>

          <p className="text-center text-primary-100 text-sm mt-6">
            &copy; {new Date().getFullYear()} Cultural Heritage DAM. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
