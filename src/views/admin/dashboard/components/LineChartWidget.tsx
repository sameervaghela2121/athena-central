import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const LineChartWidget = () => {
  const data = [
    { name: "Jan", ActiveUsers: 30 },
    { name: "Feb", ActiveUsers: 50 },
    { name: "Mar", ActiveUsers: 70 },
    { name: "Apr", ActiveUsers: 100 },
    { name: "May", ActiveUsers: 90 },
  ];

  return (
    <div className="">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Line Chart</h2>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="ActiveUsers" stroke="#4F46E5" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default LineChartWidget;
