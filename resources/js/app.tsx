import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';

import { CanvasProvider } from '@/contexts/CanvasContext';
import { router } from './router';
import '../css/app.css';

ReactDOM.createRoot(document.getElementById('canvas')!).render(
    <React.StrictMode>
        <CanvasProvider>
            <RouterProvider router={router} />
        </CanvasProvider>
    </React.StrictMode>
);
