import { Router } from 'express';
import { authenticated } from '../middleware/auth';
import { TripService } from '../services/TripService';
import { createTripSchema, completeStopSchema } from '../dto/schemas';

const router = Router();
const tripService = new TripService();

router.get('/', authenticated, async (req, res, next) => {
  try {
    const { status } = req.query;
    const trips = await tripService.list(status as string);
    res.json(trips);
  } catch (err) {
    next(err);
  }
});

router.post('/', authenticated, async (req, res, next) => {
  try {
    const body = createTripSchema.parse(req.body);
    const trip = await tripService.create(req.user!.id, body.stops);
    res.status(201).json(trip);
  } catch (err) {
    next(err);
  }
});

router.get('/:tripId', authenticated, async (req, res, next) => {
  try {
    const trip = await tripService.getById(req.params.tripId);
    res.json(trip);
  } catch (err) {
    next(err);
  }
});

router.post('/:tripId/stops/:stopId/wishes', authenticated, async (req, res, next) => {
  try {
    // TODO: Implement manual wish assignment
    res.status(501).json({ message: 'Not implemented' });
  } catch (err) {
    next(err);
  }
});

router.post('/:tripId/stops/:stopId/complete', authenticated, async (req, res, next) => {
  try {
    const body = completeStopSchema.parse(req.body);
    const stop = await tripService.completeStop(req.params.tripId, req.params.stopId, body.notFoundWishIds);
    res.json(stop);
  } catch (err) {
    next(err);
  }
});

export default router;
