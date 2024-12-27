import { Router } from "express";

export const indexRouter = Router();

indexRouter.get(`/`, (req, res) => {
    res.render(`index.ejs`, { title: `Home`, description: `Home` });
    });

indexRouter.get(`/login`, (req, res) => {
    res.render(`login.ejs`, { title: `Login`, description: `Login` });
    });

indexRouter.get(`/register`, (req, res) => {
    res.render(`register.ejs`, { title: `Register`, description: `Register` });
});

indexRouter.get(`/*fallback`, (req, res) => { 
    res.status(404).render(`404.ejs`, { title: `404`, description: `404` });
})