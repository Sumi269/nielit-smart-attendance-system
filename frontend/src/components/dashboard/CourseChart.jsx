import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const data = [
  { course: "CABA", attendance: 89 },
  { course: "Cyber", attendance: 84 },
  { course: "IT-O Level", attendance: 92 },
  { course: "Other", attendance: 81 },
];

export default function CourseChart() {
  return (
    <div className="chart-container course-chart">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 15, left: 5, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis
            type="number"
            domain={[0, 100]}
            unit="%"
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="course"
            width={75}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip formatter={(value) => [`${value}%`, "Attendance"]} />
          <Bar
            dataKey="attendance"
            fill="#2563eb"
            radius={[0, 5, 5, 0]}
            barSize={20}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}