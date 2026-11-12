import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const data = [
  { day: "Mon", present: 168, absent: 22 },
  { day: "Tue", present: 174, absent: 16 },
  { day: "Wed", present: 161, absent: 29 },
  { day: "Thu", present: 180, absent: 10 },
  { day: "Fri", present: 172, absent: 18 },
  { day: "Sat", present: 155, absent: 20 },
];

export default function AttendanceChart() {
  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="day" axisLine={false} tickLine={false} />
          <YAxis axisLine={false} tickLine={false} />
          <Tooltip />

          <Area
            type="monotone"
            dataKey="present"
            name="Present"
            stroke="#2563eb"
            fill="#bfdbfe"
            fillOpacity={0.6}
            strokeWidth={2}
          />

          <Area
            type="monotone"
            dataKey="absent"
            name="Absent"
            stroke="#f59e0b"
            fill="#fde68a"
            fillOpacity={0.5}
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}