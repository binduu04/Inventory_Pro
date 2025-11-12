// // import { useEffect, useState } from "react";
// // import axios from "axios";
// // import { useAuth } from "../context/AuthContext";
// // import {
// //   BarChart3,
// //   TrendingUp,
// //   PieChart,
// //   ShoppingBag,
// //   Calendar,
// //   Globe2,
// //   Star,
// //   AlertTriangle,
// // } from "lucide-react";

// // const Analytics = () => {
// //   const { session } = useAuth();
// //   const [data, setData] = useState(null);
// //   const [loading, setLoading] = useState(true);
// //   const [error, setError] = useState(null);

// //   useEffect(() => {
// //     if (!session?.access_token) return;

// //     const fetchAnalytics = async () => {
// //       try {
// //         setLoading(true);
// //         setError(null);

// //         const baseUrl = "http://localhost:5000/api/analytics";
// //         const headers = {
// //           Authorization: `Bearer ${session.access_token}`,
// //           "Content-Type": "application/json",
// //         };

// //         console.log("📡 Fetching analytics data from backend...");

// //         // Fetch all endpoints in parallel
// //         const [
// //           salesOverviewRes,
// //           categoryWiseRes,
// //           weeklySalesRes,
// //           channelWiseRes,
// //           productPerfRes,
// //         ] = await Promise.all([
// //           axios.get(`${baseUrl}/sales-overview`, { headers }),
// //           axios.get(`${baseUrl}/category-wise`, { headers }),
// //           axios.get(`${baseUrl}/weekly-sales`, { headers }),
// //           axios.get(`${baseUrl}/channel-wise`, { headers }),
// //           axios.get(`${baseUrl}/product-performance`, { headers }),
// //         ]);

// //         const formattedData = {
// //           salesSummary: salesOverviewRes.data.data || {},
// //           categoryWise: categoryWiseRes.data.data || [],
// //           weeklySales: weeklySalesRes.data.data || [],
// //           channelWise: channelWiseRes.data.data || [],
// //           topProducts: productPerfRes.data.data?.top_products || [],
// //           bottomProducts: productPerfRes.data.data?.bottom_products || [],
// //         };

// //         console.group("📊 Analytics Data Received");
// //         console.log("Sales Overview →", formattedData.salesSummary);
// //         console.log("Category Wise →", formattedData.categoryWise);
// //         console.log("Weekly Sales →", formattedData.weeklySales);
// //         console.log("Channel Wise →", formattedData.channelWise);
// //         console.log("Top Products →", formattedData.topProducts);
// //         console.log("Bottom Products →", formattedData.bottomProducts);
// //         console.groupEnd();

// //         setData(formattedData);
// //       } catch (err) {
// //         console.error("❌ Error fetching analytics:", err);
// //         setError(
// //           "Failed to load analytics data. Please check your connection or permissions."
// //         );
// //       } finally {
// //         setLoading(false);
// //       }
// //     };

// //     fetchAnalytics();
// //   }, [session?.access_token]);

// //   if (loading) {
// //     return (
// //       <div className="flex flex-col items-center justify-center h-full text-gray-500">
// //         <BarChart3 size={40} className="animate-pulse mb-3" />
// //         <p>Loading analytics data...</p>
// //       </div>
// //     );
// //   }

// //   if (error) {
// //     return (
// //       <div className="flex flex-col items-center justify-center h-full text-red-500">
// //         <AlertTriangle size={40} className="mb-3" />
// //         <p>{error}</p>
// //       </div>
// //     );
// //   }

// //   if (!data) return null;

// //   return (
// //     <div>
// //       <h1 className="text-3xl font-bold text-gray-800 mb-6">
// //         Analytics Dashboard
// //       </h1>

// //       {/* 1️⃣ SALES OVERVIEW */}
// //       <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
// //         <StatCard
// //           title="Total Revenue"
// //           value={`₹${data.salesSummary.total_revenue?.toLocaleString() || 0}`}
// //           icon={TrendingUp}
// //           color="bg-green-500"
// //         />
// //         <StatCard
// //           title="Total Orders"
// //           value={data.salesSummary.total_orders || 0}
// //           icon={ShoppingBag}
// //           color="bg-blue-500"
// //         />
// //         <StatCard
// //           title="Avg. Order Value"
// //           value={`₹${data.salesSummary.avg_order_value || 0}`}
// //           icon={Star}
// //           color="bg-purple-500"
// //         />
// //       </section>

// //       {/* 2️⃣ CATEGORY-WISE ANALYSIS */}
// //       <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
// //         <SectionHeader title="Category-wise Sales" icon={PieChart} />
// //         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
// //           <EnhancedBarChart
// //             title="Category-wise Sales (₹)"
// //             data={data.categoryWise}
// //             xKey="category"
// //             yKey="sales"
// //           />
// //           <SimplePieChart data={data.categoryWise} />
// //         </div>
// //       </section>

// //       {/* 3️⃣ WEEKLY TREND */}
// //       <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
// //         <SectionHeader title="Weekly Sales Comparison" icon={Calendar} />
// //         <EnhancedBarChart
// //           title="Weekly Revenue (₹)"
// //           data={data.weeklySales}
// //           xKey="week"
// //           yKey="revenue"
// //         />
// //       </section>

// //       {/* 4️⃣ CHANNEL-WISE */}
// //       <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
// //         <SectionHeader title="Channel-wise Revenue" icon={Globe2} />
// //         <EnhancedBarChart
// //           title="Online vs Offline Revenue (₹)"
// //           data={data.channelWise}
// //           xKey="type"
// //           yKey="revenue"
// //         />
// //       </section>

// //       {/* 5️⃣ PRODUCT PERFORMANCE */}
// //       <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
// //         <SectionHeader title="Top & Bottom 5 Products" icon={ShoppingBag} />
// //         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
// //           <ProductList
// //             title="Top 5 Products"
// //             products={data.topProducts}
// //             positive
// //           />
// //           <ProductList
// //             title="Bottom 5 Products"
// //             products={data.bottomProducts}
// //           />
// //         </div>
// //       </section>
// //     </div>
// //   );
// // };

// // // ------------------------------
// // // COMPONENTS BELOW
// // // ------------------------------

// // const StatCard = ({ title, value, icon: Icon, color }) => (
// //   <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between">
// //     <div>
// //       <p className="text-gray-500 text-sm mb-1">{title}</p>
// //       <p className="text-2xl font-bold text-gray-800">{value}</p>
// //     </div>
// //     <div className={`${color} p-3 rounded-lg`}>
// //       <Icon className="text-white" size={24} />
// //     </div>
// //   </div>
// // );

// // const SectionHeader = ({ title, icon: Icon }) => (
// //   <div className="flex items-center gap-3 mb-4">
// //     <Icon size={22} className="text-indigo-600" />
// //     <h2 className="text-lg font-semibold text-gray-700">{title}</h2>
// //   </div>
// // );

// // // // 🎨 Enhanced Bar Chart with Value Labels
// // // const EnhancedBarChart = ({ title, data, xKey, yKey }) => {
// // //   if (!data || data.length === 0)
// // //     return <p className="text-gray-500 text-sm">No data available</p>;

// // //   const maxY = Math.max(...data.map((d) => d[yKey])) || 1;

// // //   console.log(`📈 Rendering chart for ${title}:`, data);

// // //   return (
// // //     <div className="w-full">
// // //       <h3 className="text-sm text-gray-600 font-semibold mb-2">{title}</h3>
// // //       <div className="h-72 flex items-end gap-3 justify-around">
// // //         {data.map((item, i) => (
// // //           <div key={i} className="flex flex-col items-center flex-1">
// // //             <div
// // //               className="bg-indigo-500 rounded-t-md w-10 flex items-end justify-center text-white font-medium text-xs"
// // //               style={{
// // //                 height: `${Math.max((item[yKey] / maxY) * 100, 5)}%`,
// // //               }}
// // //             >
// // //               ₹{item[yKey]?.toLocaleString()}
// // //             </div>
// // //             <p className="text-xs mt-2 text-gray-600 text-center truncate">
// // //               {item[xKey]}
// // //             </p>
// // //           </div>
// // //         ))}
// // //       </div>
// // //     </div>
// // //   );
// // // };

// // // 🌈 Fully fixed and styled Bar Chart
// // const EnhancedBarChart = ({ title, data, xKey, yKey }) => {
// //   if (!data || data.length === 0)
// //     return <p className="text-gray-500 text-sm">No data available</p>;

// //   const maxY = Math.max(...data.map((d) => d[yKey])) || 1;

// //   console.log(`📈 Rendering chart for ${title}:`, data);

// //   return (
// //     <div className="w-full p-6 bg-gradient-to-b from-gray-50 to-white rounded-xl border border-gray-200 shadow-sm">
// //       <h3 className="text-base font-semibold text-gray-700 mb-3">{title}</h3>

// //       <div
// //         className="relative flex items-end justify-around gap-8 pt-4 pb-8"
// //         style={{ height: "350px" }} // 🔥 Increased height for better visuals
// //       >
// //         {/* ✅ Subtle horizontal gridlines */}
// //         {[0.25, 0.5, 0.75, 1].map((p, i) => (
// //           <div
// //             key={i}
// //             className="absolute left-0 w-full border-t border-gray-200"
// //             style={{ bottom: `${p * 100}%` }}
// //           />
// //         ))}

// //         {data.map((item, i) => {
// //           const barHeight = (item[yKey] / maxY) * 90; // relative scaling
// //           const barColors = [
// //             "from-indigo-500 to-blue-400",
// //             "from-blue-400 to-cyan-400",
// //             "from-purple-500 to-pink-400",
// //             "from-green-500 to-teal-400",
// //             "from-orange-400 to-amber-400",
// //           ];
// //           const gradient = barColors[i % barColors.length];

// //           return (
// //             <div
// //               key={i}
// //               className="flex flex-col items-center justify-end flex-1 group relative"
// //             >
// //               {/* Label above bar */}
// //               <span className="text-sm font-semibold text-gray-700 mb-2">
// //                 ₹{item[yKey].toLocaleString()}
// //               </span>

// //               {/* Bar */}
// //               <div
// //                 className={`w-12 sm:w-16 rounded-t-xl bg-gradient-to-t ${gradient} shadow-md transition-all duration-300 group-hover:scale-105`}
// //                 style={{ height: `${barHeight}%` }}
// //                 title={`${item[xKey]}: ₹${item[yKey].toLocaleString()}`}
// //               ></div>

// //               {/* X-axis label */}
// //               <p className="text-xs mt-3 text-gray-600 font-medium truncate max-w-[6rem] text-center">
// //                 {item[xKey]}
// //               </p>
// //             </div>
// //           );
// //         })}
// //       </div>

// //       <p className="text-sm text-gray-500 text-center mt-2">
// //         {title} (₹)
// //       </p>
// //     </div>
// //   );
// // };


// // // 🥧 Simple Pie Chart
// // const SimplePieChart = ({ data }) => {
// //   if (!data || data.length === 0)
// //     return <p className="text-gray-500 text-sm">No data available</p>;
// //   const total = data.reduce((acc, d) => acc + d.sales, 0);
// //   console.log("🥧 Rendering pie chart:", data);

// //   return (
// //     <div className="flex flex-col items-center justify-center">
// //       <div className="relative w-40 h-40 rounded-full bg-gradient-to-r from-indigo-500 to-blue-400 flex items-center justify-center text-white font-semibold text-lg">
// //         ₹{Math.round(total / 1000)}k
// //       </div>
// //       <ul className="mt-4 text-sm text-gray-600">
// //         {data.map((item, i) => (
// //           <li key={i}>
// //             <span className="font-medium text-gray-800">{item.category}</span> —{" "}
// //             ₹{item.sales.toLocaleString()}
// //           </li>
// //         ))}
// //       </ul>
// //     </div>
// //   );
// // };

// // // 🧾 Product Lists
// // const ProductList = ({ title, products, positive = false }) => {
// //   console.log(`🛍️ Rendering ${title}:`, products);

// //   return (
// //     <div>
// //       <h3
// //         className={`font-semibold mb-3 ${
// //           positive ? "text-green-600" : "text-red-600"
// //         }`}
// //       >
// //         {title}
// //       </h3>
// //       <ul className="space-y-2">
// //         {products && products.length > 0 ? (
// //           products.map((p, i) => (
// //             <li
// //               key={i}
// //               className="flex justify-between bg-gray-50 border border-gray-100 p-3 rounded-md text-sm hover:bg-gray-100 transition"
// //             >
// //               <span>{p.name}</span>
// //               <span className="font-semibold">{p.sales}</span>
// //             </li>
// //           ))
// //         ) : (
// //           <p className="text-gray-500 text-sm">No product data</p>
// //         )}
// //       </ul>
// //     </div>
// //   );
// // };

// // export default Analytics;
// import { useEffect, useState } from "react";
// import axios from "axios";
// import { useAuth } from "../context/AuthContext";
// // 📊 Enhanced Recharts Bar Chart
// import {
//   BarChart,
//   Bar,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   ResponsiveContainer,
//   PieChart as RePieChart,
//   Pie,
//   Cell,
//   Legend,
// } from "recharts";




// const Analytics = () => {
//   const { session } = useAuth();
//   const [data, setData] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     if (!session?.access_token) return;

//     const fetchAnalytics = async () => {
//       try {
//         setLoading(true);
//         setError(null);

//         const baseUrl = "http://localhost:5000/api/analytics";
//         const headers = {
//           Authorization: `Bearer ${session.access_token}`,
//           "Content-Type": "application/json",
//         };

//         console.log("📡 Fetching analytics data from backend...");

//         const [
//           salesOverviewRes,
//           categoryWiseRes,
//           weeklySalesRes,
//           channelWiseRes,
//           productPerfRes,
//         ] = await Promise.all([
//           axios.get(`${baseUrl}/sales-overview`, { headers }),
//           axios.get(`${baseUrl}/category-wise`, { headers }),
//           axios.get(`${baseUrl}/weekly-sales`, { headers }),
//           axios.get(`${baseUrl}/channel-wise`, { headers }),
//           axios.get(`${baseUrl}/product-performance`, { headers }),
//         ]);

//         const formattedData = {
//           salesSummary: salesOverviewRes.data.data || {},
//           categoryWise: categoryWiseRes.data.data || [],
//           weeklySales: weeklySalesRes.data.data || [],
//           channelWise: channelWiseRes.data.data || [],
//           topProducts: productPerfRes.data.data?.top_products || [],
//           bottomProducts: productPerfRes.data.data?.bottom_products || [],
//         };

//         console.group("📊 Analytics Data Received");
//         console.log("Sales Overview →", formattedData.salesSummary);
//         console.log("Category Wise →", formattedData.categoryWise);
//         console.log("Weekly Sales →", formattedData.weeklySales);
//         console.log("Channel Wise →", formattedData.channelWise);
//         console.log("Top Products →", formattedData.topProducts);
//         console.log("Bottom Products →", formattedData.bottomProducts);
//         console.groupEnd();

//         setData(formattedData);
//       } catch (err) {
//         console.error("❌ Error fetching analytics:", err);
//         setError("Failed to load analytics data. Please check your connection or permissions.");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchAnalytics();
//   }, [session?.access_token]);

//   // ------------------------
//   // UI STATE HANDLING
//   // ------------------------
//   if (loading)
//     return (
//       <div className="flex flex-col items-center justify-center h-full text-gray-500">
//         <BarChart3 size={40} className="animate-pulse mb-3" />
//         <p>Loading analytics data...</p>
//       </div>
//     );

//   if (error)
//     return (
//       <div className="flex flex-col items-center justify-center h-full text-red-500">
//         <AlertTriangle size={40} className="mb-3" />
//         <p>{error}</p>
//       </div>
//     );

//   if (!data) return null;

//   // ------------------------
//   // MAIN DASHBOARD
//   // ------------------------
//   return (
//     <div>
//       <h1 className="text-3xl font-bold text-gray-800 mb-6">Analytics Dashboard</h1>

//       {/* 1️⃣ SALES OVERVIEW */}
//       <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
//         <StatCard
//           title="Total Revenue"
//           value={`₹${data.salesSummary.total_revenue?.toLocaleString() || 0}`}
//           icon={TrendingUp}
//           color="bg-green-500"
//         />
//         <StatCard
//           title="Total Orders"
//           value={data.salesSummary.total_orders || 0}
//           icon={ShoppingBag}
//           color="bg-blue-500"
//         />
//         <StatCard
//           title="Avg. Order Value"
//           value={`₹${data.salesSummary.avg_order_value || 0}`}
//           icon={Star}
//           color="bg-purple-500"
//         />
//       </section>

//       {/* 2️⃣ CATEGORY-WISE ANALYSIS */}
//       <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
//         <SectionHeader title="Category-wise Sales" icon={PieChart} />
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
//           <EnhancedBarChart
//             title="Category-wise Sales (₹)"
//             data={data.categoryWise}
//             xKey="category"
//             yKey="sales"
//           />
//           <SimplePieChart data={data.categoryWise} />
//         </div>
//       </section>

//       {/* 3️⃣ WEEKLY TREND */}
//       <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
//         <SectionHeader title="Weekly Sales Comparison" icon={Calendar} />
//         <EnhancedBarChart
//           title="Weekly Revenue (₹)"
//           data={data.weeklySales}
//           xKey="week"
//           yKey="revenue"
//         />
//       </section>

//       {/* 4️⃣ CHANNEL-WISE */}
//       <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
//         <SectionHeader title="Channel-wise Revenue" icon={Globe2} />
//         <EnhancedBarChart
//           title="Online vs Offline Revenue (₹)"
//           data={data.channelWise}
//           xKey="type"
//           yKey="revenue"
//         />
//       </section>

//       {/* 5️⃣ PRODUCT PERFORMANCE */}
//       <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
//         <SectionHeader title="Top & Bottom 5 Products" icon={ShoppingBag} />
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//           <ProductList title="Top 5 Products" products={data.topProducts} positive />
//           <ProductList title="Bottom 5 Products" products={data.bottomProducts} />
//         </div>
//       </section>
//     </div>
//   );
// };

// // ---------------------------------------------
// // COMPONENTS
// // ---------------------------------------------

// const StatCard = ({ title, value, icon: Icon, color }) => (
//   <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between">
//     <div>
//       <p className="text-gray-500 text-sm mb-1">{title}</p>
//       <p className="text-2xl font-bold text-gray-800">{value}</p>
//     </div>
//     <div className={`${color} p-3 rounded-lg`}>
//       <Icon className="text-white" size={24} />
//     </div>
//   </div>
// );

// const SectionHeader = ({ title, icon: Icon }) => (
//   <div className="flex items-center gap-3 mb-4">
//     <Icon size={22} className="text-indigo-600" />
//     <h2 className="text-lg font-semibold text-gray-700">{title}</h2>
//   </div>
// );

// // // 🌈 ENHANCED BAR CHART (Finalized)
// // const EnhancedBarChart = ({ title, data, xKey, yKey }) => {
// //   if (!data || data.length === 0)
// //     return <p className="text-gray-500 text-sm">No data available</p>;

// //   const maxY = Math.max(...data.map((d) => d[yKey])) || 1;
// //   console.log(`📈 Rendering chart for ${title}:`, data);

// //   const gradients = [
// //     "from-indigo-500 to-blue-400",
// //     "from-blue-400 to-cyan-400",
// //     "from-purple-500 to-pink-400",
// //     "from-green-500 to-teal-400",
// //     "from-orange-400 to-amber-400",
// //   ];

// //   return (
// //     <div className="w-full p-6 bg-gradient-to-b from-gray-50 to-white rounded-xl border border-gray-200 shadow-sm">
// //       <h3 className="text-base font-semibold text-gray-700 mb-3">{title}</h3>

// //       <div
// //         className="relative flex items-end justify-around gap-8 pt-6 pb-10"
// //         style={{ height: "380px" }}
// //       >
// //         {[0.25, 0.5, 0.75, 1].map((p, i) => (
// //           <div
// //             key={i}
// //             className="absolute left-0 w-full border-t border-gray-200"
// //             style={{ bottom: `${p * 100}%` }}
// //           />
// //         ))}

// //         {data.map((item, i) => {
// //           const barHeight = (item[yKey] / maxY) * 90;
// //           const gradient = gradients[i % gradients.length];

// //           return (
// //             <div key={i} className="flex flex-col items-center justify-end flex-1 group relative">
// //               <span className="text-sm font-semibold text-gray-700 mb-2">
// //                 ₹{item[yKey].toLocaleString()}
// //               </span>
// //               <div
// //                 className={`w-14 sm:w-16 rounded-t-xl bg-gradient-to-t ${gradient} shadow-md transition-all duration-300 group-hover:scale-105`}
// //                 style={{ height: `${barHeight}%` }}
// //                 title={`${item[xKey]}: ₹${item[yKey].toLocaleString()}`}
// //               ></div>
// //               <p className="text-xs mt-3 text-gray-600 font-medium truncate max-w-[7rem] text-center">
// //                 {item[xKey]}
// //               </p>
// //             </div>
// //           );
// //         })}
// //       </div>
// //     </div>
// //   );
// // };

// // // 🥧 SIMPLE PIE CHART
// // const SimplePieChart = ({ data }) => {
// //   if (!data || data.length === 0)
// //     return <p className="text-gray-500 text-sm">No data available</p>;
// //   const total = data.reduce((acc, d) => acc + d.sales, 0);
// //   console.log("🥧 Rendering pie chart:", data);

// //   return (
// //     <div className="flex flex-col items-center justify-center">
// //       <div className="relative w-44 h-44 rounded-full bg-gradient-to-r from-indigo-500 to-blue-400 flex items-center justify-center text-white font-semibold text-lg">
// //         ₹{Math.round(total / 1000)}k
// //       </div>
// //       <ul className="mt-4 text-sm text-gray-600">
// //         {data.map((item, i) => (
// //           <li key={i}>
// //             <span className="font-medium text-gray-800">{item.category}</span> — ₹
// //             {item.sales.toLocaleString()}
// //           </li>
// //         ))}
// //       </ul>
// //     </div>
// //   );
// // };

// const EnhancedBarChart = ({ title, data, xKey, yKey }) => {
//   if (!data || data.length === 0)
//     return <p className="text-gray-500 text-sm">No data available</p>;

//   return (
//     <div className="w-full h-[400px] p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
//       <h3 className="text-base font-semibold text-gray-700 mb-3">{title}</h3>
//       <ResponsiveContainer width="100%" height="90%">
//         <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
//           <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
//           <XAxis dataKey={xKey} tick={{ fill: "#4b5563" }} />
//           <YAxis tick={{ fill: "#4b5563" }} />
//           <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
//           <Bar dataKey={yKey} fill="#6366f1" radius={[8, 8, 0, 0]} />
//         </BarChart>
//       </ResponsiveContainer>
//     </div>
//   );
// };

// // 🥧 Recharts Pie Chart
// const SimplePieChart = ({ data }) => {
//   if (!data || data.length === 0)
//     return <p className="text-gray-500 text-sm">No data available</p>;

//   const COLORS = ["#6366f1", "#3b82f6", "#22d3ee", "#a855f7", "#f59e0b"];
//   const total = data.reduce((acc, d) => acc + d.sales, 0);

//   return (
//     <div className="flex flex-col items-center justify-center w-full h-[400px]">
//       <ResponsiveContainer width="100%" height="80%">
//         <RePieChart>
//           <Pie
//             data={data}
//             dataKey="sales"
//             nameKey="category"
//             innerRadius={70}
//             outerRadius={110}
//             paddingAngle={4}
//           >
//             {data.map((entry, index) => (
//               <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
//             ))}
//           </Pie>
//           <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
//           <Legend />
//         </RePieChart>
//       </ResponsiveContainer>
//       <p className="mt-2 text-gray-700 font-medium">Total: ₹{total.toLocaleString()}</p>
//     </div>
//   );
// };

// // 🧾 PRODUCT LIST
// const ProductList = ({ title, products, positive = false }) => (
//   <div>
//     <h3
//       className={`font-semibold mb-3 ${
//         positive ? "text-green-600" : "text-red-600"
//       }`}
//     >
//       {title}
//     </h3>
//     <ul className="space-y-2">
//       {products && products.length > 0 ? (
//         products.map((p, i) => (
//           <li
//             key={i}
//             className="flex justify-between bg-gray-50 border border-gray-100 p-3 rounded-md text-sm hover:bg-gray-100 transition"
//           >
//             <span>{p.name}</span>
//             <span className="font-semibold">{p.sales}</span>
//           </li>
//         ))
//       ) : (
//         <p className="text-gray-500 text-sm">No product data</p>
//       )}
//     </ul>
//   </div>
// );

// export default Analytics;
import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import {
  BarChart3,
  TrendingUp,
  PieChart,
  ShoppingBag,
  Calendar,
  Globe2,
  Star,
  AlertTriangle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const Analytics = () => {
  const { session } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!session?.access_token) return;

    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);

        const baseUrl = "http://localhost:5000/api/analytics";
        const headers = {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        };

        console.log("📡 Fetching analytics data from backend...");

        const [
          salesOverviewRes,
          categoryWiseRes,
          weeklySalesRes,
          channelWiseRes,
          productPerfRes,
        ] = await Promise.all([
          axios.get(`${baseUrl}/sales-overview`, { headers }),
          axios.get(`${baseUrl}/category-wise`, { headers }),
          axios.get(`${baseUrl}/weekly-sales`, { headers }),
          axios.get(`${baseUrl}/channel-wise`, { headers }),
          axios.get(`${baseUrl}/product-performance`, { headers }),
        ]);

        const formattedData = {
          salesSummary: salesOverviewRes.data.data || {},
          categoryWise: categoryWiseRes.data.data || [],
          weeklySales: weeklySalesRes.data.data || [],
          channelWise: channelWiseRes.data.data || [],
          topProducts: productPerfRes.data.data?.top_products || [],
          bottomProducts: productPerfRes.data.data?.bottom_products || [],
        };

        console.group("📊 Analytics Data Received");
        console.log("Sales Overview →", formattedData.salesSummary);
        console.log("Category Wise →", formattedData.categoryWise);
        console.log("Weekly Sales →", formattedData.weeklySales);
        console.log("Channel Wise →", formattedData.channelWise);
        console.log("Top Products →", formattedData.topProducts);
        console.log("Bottom Products →", formattedData.bottomProducts);
        console.groupEnd();

        setData(formattedData);
      } catch (err) {
        console.error("❌ Error fetching analytics:", err);
        setError("Failed to load analytics data. Please check your connection or permissions.");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [session?.access_token]);

  // ------------------------
  // UI STATE HANDLING
  // ------------------------
  if (loading)
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <BarChart3 size={40} className="animate-pulse mb-3" />
        <p>Loading analytics data...</p>
      </div>
    );

  if (error)
    return (
      <div className="flex flex-col items-center justify-center h-full text-red-500">
        <AlertTriangle size={40} className="mb-3" />
        <p>{error}</p>
      </div>
    );

  if (!data) return null;

  // ------------------------
  // MAIN DASHBOARD
  // ------------------------
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Analytics Dashboard</h1>

      {/* 1️⃣ SALES OVERVIEW */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Total Revenue"
          value={`₹${data.salesSummary.total_revenue?.toLocaleString() || 0}`}
          icon={TrendingUp}
          color="bg-green-500"
        />
        <StatCard
          title="Total Orders"
          value={data.salesSummary.total_orders || 0}
          icon={ShoppingBag}
          color="bg-blue-500"
        />
        <StatCard
          title="Avg. Order Value"
          value={`₹${data.salesSummary.avg_order_value || 0}`}
          icon={Star}
          color="bg-purple-500"
        />
      </section>

      {/* 2️⃣ CATEGORY-WISE ANALYSIS */}
      <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
        <SectionHeader title="Category-wise Sales" icon={PieChart} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <EnhancedBarChart
            title="Category-wise Sales (₹)"
            data={data.categoryWise}
            xKey="category"
            yKey="sales"
          />
          <SimplePieChart data={data.categoryWise} />
        </div>
      </section>

      {/* 3️⃣ WEEKLY TREND */}
      <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
        <SectionHeader title="Weekly Sales Comparison" icon={Calendar} />
        <EnhancedBarChart
          title="Weekly Revenue (₹)"
          data={data.weeklySales}
          xKey="week"
          yKey="revenue"
        />
      </section>

      {/* 4️⃣ CHANNEL-WISE */}
      <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
        <SectionHeader title="Channel-wise Revenue" icon={Globe2} />
        <EnhancedBarChart
          title="Online vs Offline Revenue (₹)"
          data={data.channelWise}
          xKey="type"
          yKey="revenue"
        />
      </section>

      {/* 5️⃣ PRODUCT PERFORMANCE */}
      <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <SectionHeader title="Top & Bottom 5 Products" icon={ShoppingBag} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ProductList title="Top 5 Products" products={data.topProducts} positive />
          <ProductList title="Bottom 5 Products" products={data.bottomProducts} />
        </div>
      </section>
    </div>
  );
};

// ---------------------------------------------
// COMPONENTS
// ---------------------------------------------

const StatCard = ({ title, value, icon: Icon, color }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between">
    <div>
      <p className="text-gray-500 text-sm mb-1">{title}</p>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
    </div>
    <div className={`${color} p-3 rounded-lg`}>
      <Icon className="text-white" size={24} />
    </div>
  </div>
);

const SectionHeader = ({ title, icon: Icon }) => (
  <div className="flex items-center gap-3 mb-4">
    <Icon size={22} className="text-indigo-600" />
    <h2 className="text-lg font-semibold text-gray-700">{title}</h2>
  </div>
);

// 📊 ENHANCED RECHARTS BAR CHART
const EnhancedBarChart = ({ title, data, xKey, yKey }) => {
  if (!data || data.length === 0)
    return <p className="text-gray-500 text-sm">No data available</p>;

  return (
    <div className="w-full h-[400px] p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
      <h3 className="text-base font-semibold text-gray-700 mb-3">{title}</h3>
      <ResponsiveContainer width="100%" height="90%">
        <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey={xKey} tick={{ fill: "#4b5563" }} />
          <YAxis tick={{ fill: "#4b5563" }} />
          <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
          <Bar dataKey={yKey} fill="#6366f1" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// 🥧 RECHARTS PIE CHART
const SimplePieChart = ({ data }) => {
  if (!data || data.length === 0)
    return <p className="text-gray-500 text-sm">No data available</p>;

  const COLORS = ["#6366f1", "#3b82f6", "#22d3ee", "#a855f7", "#f59e0b"];
  const total = data.reduce((acc, d) => acc + d.sales, 0);

  return (
    <div className="flex flex-col items-center justify-center w-full h-[400px]">
      <ResponsiveContainer width="100%" height="80%">
        <RePieChart>
          <Pie
            data={data}
            dataKey="sales"
            nameKey="category"
            innerRadius={70}
            outerRadius={110}
            paddingAngle={4}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
          <Legend />
        </RePieChart>
      </ResponsiveContainer>
      <p className="mt-2 text-gray-700 font-medium">Total: ₹{total.toLocaleString()}</p>
    </div>
  );
};

// 🧾 PRODUCT LIST
const ProductList = ({ title, products, positive = false }) => (
  <div>
    <h3
      className={`font-semibold mb-3 ${
        positive ? "text-green-600" : "text-red-600"
      }`}
    >
      {title}
    </h3>
    <ul className="space-y-2">
      {products && products.length > 0 ? (
        products.map((p, i) => (
          <li
            key={i}
            className="flex justify-between bg-gray-50 border border-gray-100 p-3 rounded-md text-sm hover:bg-gray-100 transition"
          >
            <span>{p.name}</span>
            <span className="font-semibold">{p.sales}</span>
          </li>
        ))
      ) : (
        <p className="text-gray-500 text-sm">No product data</p>
      )}
    </ul>
  </div>
);

export default Analytics;
