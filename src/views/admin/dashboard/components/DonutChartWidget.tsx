import allImgPaths from "@/assets";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import WidgetHeader from "./WidgetHeader";

import { Tooltip as ReactTooltip } from "@/components";

const DonutChartWidget = () => {
  const data = [
    { name: "No Vote", value: 65, color: "#2ecc71" }, // Green color
    { name: "Downvote", value: 35, color: "#f1c40f" }, // Yellow color
  ];

  const COLORS = data.map((item) => item.color);

  return (
    <div className="">
      <WidgetHeader
        title="Feedback on Response/ Downvote & No Downvote"
        info={
          <div>
            <ReactTooltip
              title={"Feedback on Response/ Downvote & No Downvote"}
              color="info"
              place="top"
            >
              <img
                src={allImgPaths.infoDark}
                alt="info button"
                className="transition-opacity cursor-help hover:opacity-80"
              />
            </ReactTooltip>
          </div>
        }
      />
      <div>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart width={200} height={200}>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              fill="#8884d8"
              label={({ percent }) => `${(percent * 100).toFixed(0)}%`} // Percent labels
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
        {/* Legend */}
        <div style={{ marginLeft: "20px" }}>
          {data.map((entry, index) => (
            <div
              key={index}
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "10px",
              }}
            >
              <div
                style={{
                  width: "12px",
                  height: "12px",
                  backgroundColor: entry.color,
                  borderRadius: "50%",
                  marginRight: "8px",
                }}
              ></div>
              <div style={{ fontSize: "14px", color: "#333" }}>
                <strong>{entry.name}</strong>
                <span
                  style={{
                    marginLeft: "8px",
                    color: "#3498db",
                    fontSize: "18px",
                  }}
                >
                  {entry.value}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DonutChartWidget;
