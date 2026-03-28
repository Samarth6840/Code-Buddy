import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import analyzeRouter from "./analyze/index.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(analyzeRouter);

export default router;
