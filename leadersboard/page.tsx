import { useEffect, useState } from 'react';
import { fetchHuntCompletions } from '@/lib/contract-api'; // Logic: Fetching from contract

export default function LeaderboardPage({ params }: { params: { id: string } }) {
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    const loadLeaderboard = async () => {
      const data = await fetchHuntCompletions(params.id);
      
      // Logic: Order by points (descending) and then by completion time (ascending)
      const sorted = data.sort((a, b) => {
        if (b.points !== a.points) {
          return b.points - a.points; // Higher points first
        }
        return a.completionTime - b.completionTime; // Faster time wins ties
      });
      
      setPlayers(sorted);
    };
    loadLeaderboard();
  }, [params.id]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Hunt Leaderboard</h1>
      <table className="min-w-full bg-white border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border">Rank</th>
            <th className="p-2 border">Player Address</th>
            <th className="p-2 border">Points</th>
            <th className="p-2 border">Time (s)</th>
          </tr>
        </thead>
        <tbody>
          {players.map((player, index) => (
            <tr key={player.address} className="text-center">
              <td className="p-2 border font-bold">{index + 1}</td>
              <td className="p-2 border font-mono">{player.address.slice(0, 6)}...</td>
              <td className="p-2 border">{player.points}</td>
              <td className="p-2 border">{player.completionTime}s</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

