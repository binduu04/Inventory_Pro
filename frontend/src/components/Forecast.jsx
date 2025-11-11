import { useState } from "react";
import { TrendingUp, Loader2, Download } from "lucide-react";
import axios from "axios";

const Forecast = () => {
  const [loading, setLoading] = useState(false);
  const [forecastData, setForecastData] = useState([]);
  const [mode, setMode] = useState(null);

  const handleForecast = async (type) => {
    setLoading(true);
    setMode(type);
    setForecastData([]);

    try {
      const endpoint =
        type === "manual"
          ? "/api/forecast/manual"
          : "/api/forecast/save"; // backend routes (to be added later)

      // Simulated delay for demo
      // const response = await axios.post(endpoint);
      await new Promise((resolve) => setTimeout(resolve, 1500)); // simulate API call
      const response = {
        data: generateDummyForecast(),
      };

      setForecastData(response.data);
    } catch (error) {
      console.error("Error fetching forecast:", error);
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
          Manual Forecast (till yesterday)
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
          Save + Forecast (includes today)
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
            7-Day Forecast Results
          </h2>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-indigo-50 text-gray-700">
                <th className="border p-2 text-left">Product</th>
                {[...Array(7)].map((_, i) => (
                  <th key={i} className="border p-2 text-center">
                    Day {i + 1}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {forecastData.map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition-all">
                  <td className="border p-2 font-medium text-gray-800">
                    {item.product}
                  </td>
                  {item.forecast.map((day, i) => (
                    <td
                      key={i}
                      className={`border p-2 text-center rounded-md ${getColorClass(
                        day.level
                      )}`}
                    >
                      {day.qty}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// --- Dummy Data Generator (for now, until backend connects)
const generateDummyForecast = () => {
  const products = [
    "Amul Milk 1L",
    "Aashirvaad Atta 5kg",
    "Parle-G Biscuits",
    "Surf Excel 1kg",
    "Coca-Cola 2L",
  ];
  const levels = ["red", "yellow", "green"];
  return products.map((p) => ({
    product: p,
    forecast: Array.from({ length: 7 }, () => ({
      qty: Math.floor(Math.random() * 150 + 20),
      level: levels[Math.floor(Math.random() * 3)],
    })),
  }));
};

export default Forecast;
