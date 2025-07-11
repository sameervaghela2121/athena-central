import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const BarChartWidget = () => {
  const data = [
    { name: "Jan", Revenue: 400 },
    { name: "Feb", Revenue: 300 },
    { name: "Mar", Revenue: 200 },
    { name: "Apr", Revenue: 278 },
    { name: "May", Revenue: 189 },
  ];

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Bar Chart</h2>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="Revenue" fill="#60A5FA" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BarChartWidget;
