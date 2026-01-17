import { createClient } from "redis";
import type { RedisClientType } from "redis";
import { PrismaClient } from "../../generated/prisma/client.js";
import type { LeaderboardEntry } from "../types/index.js";
import { CONFIG } from "../config/index.js";

const prisma = new PrismaClient();
const redisClient: RedisClientType = createClient({ 
  url: CONFIG.REDIS_URL
}) as RedisClientType;

// Redis connection
redisClient.on("error", (err) => console.log(" Redis Client Error", err));
redisClient.on("connect", () => console.log(" Redis Client Connected"));
redisClient.connect();

export async function updateContestLeaderboard(contestId: string, userId: string, points: number) {

  const key = `leaderboard:${contestId}`;
  try {
    await redisClient.zIncrBy(key, points, userId);
  } catch (error) {
    console.error(' Error updating leaderboard:', error);
  }
}

export async function getContestLeaderboard(contestId: string, limit = 100): Promise<LeaderboardEntry[]> {
  
  const key = `leaderboard:${contestId}`;
  try {
    const results = await redisClient.zRangeWithScores(key, 0, limit - 1, { REV: true });
    
    const leaderboard = results.map((r, index) => ({
      userId: r.value,
      points: r.score,
      rank: index + 1,
    }));
    
    return leaderboard;
  } catch (error) {
    console.error(' Error getting leaderboard from Redis:', error);
    return [];
  }
}

export async function saveLeaderboardToDB(contestId: string) {
 
  try {
    const leaderboard = await getContestLeaderboard(contestId, 1000);
  
    // Delete existing leaderboard
    await prisma.leaderboard.deleteMany({ where: { contestId } });
    
    // Save new leaderboard
    console.log('Saving new leaderboard entries...');
    await prisma.leaderboard.createMany({
      data: leaderboard.map((entry) => ({
        contestId,
        userId: entry.userId,
        rank: entry.rank,
      })),
    });
    
  } catch (error) {
    console.error(' Error saving leaderboard to DB:', error);
  }
}

// Background job to save leaderboards to DB after contest ends
export function startLeaderboardBackgroundJob() {
  console.log(' Starting background leaderboard save job...');
  setInterval(async () => {
    console.log(' Running background leaderboard save job...');
    
    try {
      const finishedContests = await prisma.contest.findMany({
        where: {
          startTime: {
            lt: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      });

      console.log(' Found', finishedContests.length, 'finished contests to process');

      for (const contest of finishedContests) {
        const key = `leaderboard:${contest.id}`;
        const exists = await redisClient.exists(key);
        
        if (exists) {
          console.log(' Saving leaderboard for contest:', contest.id);
          await saveLeaderboardToDB(contest.id);
          await redisClient.del(key);
          console.log(` Saved leaderboard for contest ${contest.id} to DB`);
        } else {
          console.log('ℹ No Redis leaderboard found for contest:', contest.id);
        }
      }
      
      console.log(' Background leaderboard job completed');
    } catch (error) {
      console.error(' Error in background leaderboard job:', error);
    }
  }, 60 * 60 * 1000);
}

export { redisClient, prisma };










