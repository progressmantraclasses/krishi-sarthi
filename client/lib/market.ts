export interface MarketRecord {
  state: string;
  district: string;
  market: string;
  commodity: string;
  variety: string;
  grade: string;
  date: string;
  minPrice: string;
  maxPrice: string;
  modalPrice: string;
}

// Normalize API response
function normalize(record: any): MarketRecord {
  return {
    state: record.State,
    district: record.District,
    market: record.Market,
    commodity: record.Commodity,
    variety: record.Variety,
    grade: record.Grade,
    date: record.Arrival_Date,
    minPrice: record["Min Price"],
    maxPrice: record["Max Price"],
    modalPrice: record["Modal Price"],
  };
}

// Fetch all data (Govt API)
export async function fetchAllMarketRates(): Promise<MarketRecord[]> {
  try {
    const url =
      "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070" +
      "?api-key=YOUR_API_KEY&format=json&limit=100"; // limit can be adjusted

    const res = await fetch(url);
    if (!res.ok) throw new Error("API fetch failed");
    const data = await res.json();

    return (data.records || []).map((r: any) => normalize(r));
  } catch (err) {
    console.error("Error fetching rates:", err);
    return [];
  }
}
