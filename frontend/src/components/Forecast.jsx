import { useState } from "react";
import { TrendingUp, Loader2, Download } from "lucide-react";

const Forecast = () => {
  const [loading, setLoading] = useState(false);
  const [forecastData, setForecastData] = useState([]);
  const [mode, setMode] = useState(null);

  const handleForecast = async (type) => {
    setLoading(true);
    setMode(type);
    setForecastData([]);

    try {
      if (type === "manual") {
        // Call the real forecast API
        const response = await fetch("http://localhost:5000/api/forecast/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            num_days: 7
          }),
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
          // Transform API response to component format
          const transformedData = transformForecastData(data.forecast);
          setForecastData(transformedData);
        } else {
          console.error("Forecast API returned error:", data.error);
          alert("Failed to generate forecast: " + (data.error || "Unknown error"));
        }
      } else {
        // EOD upload not implemented yet
        alert("EOD sales upload feature coming soon!");
      }
    } catch (error) {
      console.error("Error fetching forecast:", error);
      alert("Failed to generate forecast. Make sure backend is running and models are trained.");
    } finally {
      setLoading(false);
    }
  };

  const getColorClass = (level) => {
    switch (level) {
      case "red":
        return "bg-red-500 text-white";
      case "yellow":
        return "bg-yellow-400 text-gray-800";
      case "green":
        return "bg-green-500 text-white";
      default:
        return "bg-gray-200";
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <TrendingUp size={28} className="text-indigo-600" />
            Forecast
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            View upcoming 7-day product demand predictions.
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 mb-8">
        <button
          onClick={() => handleForecast("manual")}
          disabled={loading}
          className={`px-5 py-3 rounded-lg font-medium shadow-md transition-all ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-indigo-600 hover:bg-indigo-700 text-white"
          }`}
        >
           Run Forecast 
        </button>

        <button
          onClick={() => handleForecast("save")}
          disabled={loading}
          className={`px-5 py-3 rounded-lg font-medium shadow-md transition-all ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-700 text-white"
          }`}
        >
          Upload EOD sales + Forecast 
        </button>

        {forecastData.length > 0 && (
          <button
            className="px-5 py-3 rounded-lg bg-gray-200 hover:bg-gray-300 font-medium text-gray-800 flex items-center gap-2 transition-all"
          >
            <Download size={18} />
            Download CSV
          </button>
        )}
      </div>

      {/* Loader */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="animate-spin text-indigo-600 mb-4" size={40} />
          <p className="text-gray-600 text-sm">
            Generating {mode === "save" ? "updated" : "manual"} forecast...
          </p>
        </div>
      )}

      {/* Empty State */}
      {!loading && forecastData.length === 0 && (
        <div className="text-center py-24">
          <TrendingUp size={56} className="mx-auto text-gray-400 mb-3" />
          <h3 className="text-xl font-semibold text-gray-700 mb-1">
            No Forecast Yet
          </h3>
          <p className="text-gray-500">
            Click one of the buttons above to generate predictions.
          </p>
        </div>
      )}

      {/* Forecast Table */}
      {!loading && forecastData.length > 0 && (
        <div className="bg-white shadow-md rounded-xl border border-gray-200 p-6 overflow-x-auto">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            7-Day Forecast Results ({forecastData.length} Products)
          </h2>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-indigo-50 text-gray-700">
                <th className="border p-2 text-left">Product</th>
                <th className="border p-2 text-left">Category</th>
                {forecastData[0]?.forecast.map((day, i) => (
                  <th key={i} className="border p-2 text-center">
                    {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {forecastData.slice(0, 50).map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition-all">
                  <td className="border p-2 font-medium text-gray-800">
                    {item.product}
                  </td>
                  <td className="border p-2 text-gray-600 text-xs">
                    {item.category}
                  </td>
                  {item.forecast.map((day, i) => (
                    <td
                      key={i}
                      className={`border p-2 text-center rounded-md ${getColorClass(
                        day.level
                      )}`}
                      title={`₹${day.revenue.toFixed(2)}`}
                    >
                      {day.qty}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {forecastData.length > 20 && (
            <p className="text-gray-500 text-sm mt-4 text-center">
              Showing all 50 products
            </p>
          )}
        </div>
      )}
    </div>
  );
};

// --- Transform API response to component format
const transformForecastData = (apiData) => {
  // Group by product and create 7-day forecast per product
  const productMap = {};
  
  apiData.forEach(item => {
    if (!productMap[item.product_name]) {
      productMap[item.product_name] = {
        product: item.product_name,
        category: item.category,
        forecast: []
      };
    }
    
    // Determine urgency level based on quantity
    let level = 'green';
    if (item.predicted_quantity < 10) {
      level = 'red'; // Low stock urgency
    } else if (item.predicted_quantity < 30) {
      level = 'yellow'; // Medium stock
    }
    
    productMap[item.product_name].forecast.push({
      date: item.date,
      qty: item.predicted_quantity,
      revenue: item.forecasted_revenue,
      level: level
    });
  });
  
  // Convert to array and sort by product name
  return Object.values(productMap).sort((a, b) => 
    a.product.localeCompare(b.product)
  );
};

export default Forecast;
