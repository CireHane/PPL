# Code Structure  

**Backend**: Code and dependency for backend  

```text
├── Backend/ 
├── package-lock.json
├── package.json
├── README.md
└── src/ (All Codes)
    ├── app.js: express app
    ├── index.js: main code      
    ├── config/
    │   └── firebase.js: interface for firebase  
    └── userAuth/
        ├── userAuthHandler.js
        ├── userAuthLogic.js
        └── userAuthRoutes.js
