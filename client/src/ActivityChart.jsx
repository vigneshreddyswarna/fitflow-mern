import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts';

export default function ActivityChart({ data }) {
  return <ResponsiveContainer width="100%" height="100%"><AreaChart data={data}><defs><linearGradient id="fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#b9e84c" stopOpacity=".55"/><stop offset="1" stopColor="#b9e84c" stopOpacity="0"/></linearGradient></defs><XAxis dataKey="day" axisLine={false} tickLine={false}/><Tooltip/><Area type="monotone" dataKey="minutes" stroke="#1d2914" strokeWidth={3} fill="url(#fill)"/></AreaChart></ResponsiveContainer>;
}
