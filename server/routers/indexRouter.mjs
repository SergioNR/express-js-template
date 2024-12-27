import { Router } from "express";

export const indexRouter = Router();

indexRouter.get(`/`, (req, res) => {
    res.render(`index.ejs`);
    });





indexRouter.get(`/*fallback`, (req, res) => { 
    res.status(404).render(`404.ejs`);
})