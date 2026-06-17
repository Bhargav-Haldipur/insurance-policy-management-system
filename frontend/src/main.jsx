import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)

/*
1. Use records for CreatePolicyCommand,UpdatePolicyCommand
GetPolicyQuery,GetAllPoliciesQuery,GetPolicyEventsQuery

2. Use separate Controllers for query and command

3. HDD? Extra Layer in Architecture?

request (UI) -> Controller (RequestDTO) -> Service -> Command -> Events -> Repo -> ResponseDTO -> UI



4. DTO Changes?

5. Exception Handler remove or use

6. Reusing Document/Entity instead of creating class again in CreatePolicyCommand etc?

-- Extract Enum out and reuse
-- Date - LocalDate - consistent date time

7. Changes in what object is sent in controller

8. using Wrong timestamp and date

9. Majority of code not in try catch block in backend

10. Make some changes to onboarding document if needed


*/
