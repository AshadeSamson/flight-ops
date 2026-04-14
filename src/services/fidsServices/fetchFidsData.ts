import axios from "axios";
import { configDotenv } from "dotenv";

configDotenv();

const FIDS_BASE_URL = process.env.FIDS_API_BASE_URL!;
const API_KEY = process.env.FIDS_API_KEY!;

if (!FIDS_BASE_URL || !API_KEY) {
  throw new Error("FIDS API env variables are missing");
}

export default async function fetchFidsData() {
  try {
    const [departuresRes, arrivalsRes] = await Promise.all([
      axios.get(`${FIDS_BASE_URL}/departures.php`, {
        headers: {
          "X-Api-Key": API_KEY,
        },
      }),
      axios.get(`${FIDS_BASE_URL}/arrivals.php`, {
        headers: {
          "X-Api-Key": API_KEY,
        },
      }),
    ]);

    const departures = departuresRes.data;
    const arrivals = arrivalsRes.data;

    return {
      departures,
      arrivals,
    };
  } catch (error) {
    console.error("FIDS fetch failed:", error);
    throw new Error("Failed to fetch FIDS data");
  }
}