import express from "express";
import {
    getTournamentReferees,
    createTournamentReferee,
    updateTournamentReferee,
    linkTournamentRefereeAccount,
    deleteTournamentReferee
} from "../controllers/tournamentRefereeController.js";
import { protectedRoute } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/tournament-item/:tournamentItemId", protectedRoute(), getTournamentReferees);
router.post("/", protectedRoute("admin", "org", "organization", { profile: true }), createTournamentReferee);
router.put("/:id", protectedRoute("admin", "org", "organization", { profile: true }), updateTournamentReferee);
router.patch("/:id/link-account", protectedRoute("admin", "org", "organization", { profile: true }), linkTournamentRefereeAccount);
router.delete("/:id", protectedRoute("admin", "org", "organization", { profile: true }), deleteTournamentReferee);

export default router;
