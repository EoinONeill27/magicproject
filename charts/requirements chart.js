import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const ImplementationProgressChart = () => {
  const data = [
    { name: 'Implemented "Must Have"', value: 18, fill: '#4361ee' },
    { name: 'Implemented "Should Have"', value: 14, fill: '#3a0ca3' },
    { name: 'Implemented "Could Have"', value: 11, fill: '#4cc9f0' },
    { name: 'Unimplemented "Could Have"', value: 3, fill: '#f72585' },
    { name: 'Unimplemented "Won\'t Have"', value: 11, fill: '#cccccc' }
  ];

  const COLORS = ['#4361ee', '#3a0ca3', '#4cc9f0', '#f72585', '#cccccc'];

  return (
    <div className="w-full h-96 bg-white p-4 rounded-lg shadow">
      <h3 className="text-lg font-bold text-center mb-4">Requirement Implementation Status</h3>
      <ResponsiveContainer width="100%" height="80%">
        <PieChart>
          <Pie
            dataKey="value"
            isAnimationActive={true}
            data={data}
            cx="50%"
            cy="50%"
            outerRadius={100}
            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
            labelLine={false}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => [`${value} requirements`, '']} />
          <Legend formatter={(value) => value} layout="vertical" verticalAlign="middle" align="right" />
        </PieChart>
      </ResponsiveContainer>
      <p className="text-sm text-center mt-2">Total: 59 requirements</p>
    </div>
  );
};

export default ImplementationProgressChart;