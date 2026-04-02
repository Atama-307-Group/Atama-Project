// import {StrictMode} from 'react'
// import {createRoot} from 'react-dom/client'
// import './index.css'
// import App from './App.jsx'
//
// createRoot(document.getElementById('root')).render(
//     <StrictMode>
//         <App/>
//     </StrictMode>,
// )

// import ReactDOM from "react-dom/client";
// import StudyGoal from "./assets/StudyGoal.jsx";
// import './assets/StudyGoal.css'
//
// ReactDOM.createRoot(document.getElementById("root")).render(
//     <StudyGoal />
// );

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from "react-router-dom";
import { TimerProvider } from './context/TimerContext';
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <BrowserRouter>
            <TimerProvider>
                <App />
            </TimerProvider>
        </BrowserRouter>
    </StrictMode>,
)
