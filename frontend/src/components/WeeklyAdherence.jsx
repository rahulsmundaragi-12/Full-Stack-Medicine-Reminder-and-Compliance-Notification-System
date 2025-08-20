import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

export default function WeeklyAdherence() {
  const [weeklyData, setWeeklyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchWeeklyData();
  }, []);

  const fetchWeeklyData = async () => {
    try {
      // Get today's date and date from 7 days ago
      const today = new Date();
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

      // Fetch all intakes for the last 7 days
      const response = await axios.get('http://localhost:4000/api/intake/logs', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      // Process data for each day
      const dailyData = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(sevenDaysAgo);
        date.setDate(date.getDate() + i);
        const dayStr = date.toISOString().split('T')[0];
        
        // Filter intakes for this day
        const dayIntakes = response.data.filter(intake => {
          const intakeDate = new Date(intake.scheduledTime).toISOString().split('T')[0];
          return intakeDate === dayStr;
        });

        // Calculate adherence
        const total = dayIntakes.length;
        const taken = dayIntakes.filter(intake => intake.status === 'taken').length;
        const adherenceRate = total > 0 ? (taken / total) * 100 : 0;

        dailyData.push({
          date: date.toLocaleDateString('en-US', { weekday: 'short' }),
          adherence: Math.round(adherenceRate),
          total,
          taken
        });
      }

      setWeeklyData(dailyData);
      setError('');
    } catch (err) {
      setError('Failed to fetch weekly data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading weekly adherence...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="card">
      <h2 className="text-xl font-bold mb-4">Weekly Adherence</h2>
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <BarChart data={weeklyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis domain={[0, 100]} unit="%" />
            <Tooltip
              formatter={(value) => [`${value}%`, 'Adherence']}
              labelFormatter={(label) => `Day: ${label}`}
            />
            <Bar
              dataKey="adherence"
              fill="var(--color-accent)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <h3 className="font-bold mb-2">Statistics</h3>
          <p>
            Weekly Average:{' '}
            {Math.round(
              weeklyData.reduce((acc, day) => acc + day.adherence, 0) / 7
            )}%
          </p>
        </div>
        <div>
          <h3 className="font-bold mb-2">Legend</h3>
          <p>Each bar represents daily medicine intake adherence</p>
        </div>
      </div>
    </div>
  );
} 