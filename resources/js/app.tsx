import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';

import { CanvasProvider } from '@/contexts/CanvasContext';
import { applyTheme, resolveInitialMode } from '@/hooks/useTheme';
import { router } from './router';
import '../css/app.css';

applyTheme(resolveInitialMode(window.Canvas?.user?.canvas?.theme));

ReactDOM.createRoot(document.getElementById('canvas')!).render(
    <React.StrictMode>
        <CanvasProvider>
            <RouterProvider router={router} />
        </CanvasProvider>
    </React.StrictMode>
);
