import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import '../css/app.css';

ReactDOM.createRoot(document.getElementById('canvas')!).render(
    <React.StrictMode>
        <RouterProvider router={router} />
    </React.StrictMode>
);
