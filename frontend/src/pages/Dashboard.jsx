import {
  Users,
  CalendarCheck,
  UserCheck,
  UserX,
  CircleAlert,
} from "lucide-react";

import PageHeader from "../components/layout/PageHeader.jsx";
import StatCard from "../components/dashboard/StatCard.jsx";
import AttendanceChart from "../components/dashboard/AttendanceChart.jsx";
import CourseChart from "../components/dashboard/CourseChart.jsx";
import BatchSummary from "../components/dashboard/BatchSummary.jsx";

const statistics = [
  {
    title: "Total Students",
    value: "240",
    description: "Sample student records",
    icon: Users,
    color: "blue",
  },
  {
    title: "Classes Conducted",
    value: "24",
    description: "Sample reporting period",
    icon: CalendarCheck,
    color: "purple",
  },
  {
    title: "Present Today",
    value: "172",
    description: "Sample attendance records",
    icon: UserCheck,
    color: "green",
  },
  {
    title: "Absent Today",
    value: "18",
    description: "Requires verified records",
    icon: UserX,
    color: "orange",
  },
];

export default function Dashboard() {
  return (
    <div className="dashboard">
      <PageHeader
        title="Attendance Dashboard"
        description="Monitor attendance, batches, and records requiring review."
        eyebrow="OVERVIEW"
      />

      <div className="demo-notice">
        <CircleAlert size={20} />
        <div>
          <strong>Demonstration data only</strong>
          <p>
            All displayed figures are sample values. This frontend is not yet
            connected to actual student records, Excel files, or biometric
            devices.
          </p>
        </div>
      </div>

      <section className="filter-panel">
        <label>
          Academic year
          <select defaultValue="2026-27">
            <option value="2026-27">2026–27</option>
            <option value="2025-26">2025–26</option>
            <option value="2024-25">2024–25</option>
          </select>
        </label>

        <label>
          Course
          <select defaultValue="all">
            <option value="all">All courses</option>
            <option value="caba">CABA</option>
            <option value="cyber">Cyber Security</option>
            <option value="ito">IT-O Level</option>
          </select>
        </label>

        <label>
          Batch
          <select defaultValue="all">
            <option value="all">All batches</option>
            <option value="batch-a">Sample Batch A</option>
            <option value="batch-b">Sample Batch B</option>
          </select>
        </label>
      </section>

      <section className="stats-grid">
        {statistics.map((item) => (
          <StatCard key={item.title} {...item} />
        ))}
      </section>

      <section className="analytics-grid">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <h2>Attendance Overview</h2>
              <p>Sample daily attendance counts</p>
            </div>
            <span className="panel-badge">SAMPLE WEEK</span>
          </div>

          <AttendanceChart />
        </article>

        <article className="panel">
          <div className="panel-heading">
            <div>
              <h2>Attendance by Course</h2>
              <p>Illustrative attendance percentages</p>
            </div>
          </div>

          <CourseChart />
        </article>
      </section>

      <section className="panel batch-panel">
        <div className="panel-heading">
          <div>
            <h2>Batch Summary</h2>
            <p>Illustrative attendance by batch</p>
          </div>
        </div>

        <BatchSummary />
      </section>
    </div>
  );
}