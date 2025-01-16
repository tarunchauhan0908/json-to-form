const express = require("express");
const { google } = require("googleapis");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();

// Enable CORS to allow requests from your frontend
app.use(cors({ origin: "http://localhost:3000" }));
app.use(bodyParser.json());

// Google authentication configuration
const auth = new google.auth.GoogleAuth({
  keyFile: "./login1-439315-03b5a03b891b.json", // Path to your service account key file
  scopes: ["https://www.googleapis.com/auth/spreadsheets"], // Define the scope for Google Sheets API
});

const sheets = google.sheets({ version: "v4", auth });

const SPREADSHEET_ID = "1Cn9rY6rm2FbvEKzT940U8-DhE-W8jxccVPI1-8n6YQ4"; // Your Google Sheets Spreadsheet ID

// Helper function to flatten nested objects (convert objects/arrays to separate columns)
function flattenData(data, parent = "") {
  const flattened = {};
  for (const key in data) {
    if (typeof data[key] === "object" && data[key] !== null) {
      // Recursively flatten the object with a new parent (e.g., preferences.theme)
      Object.assign(flattened, flattenData(data[key], parent + key + "_"));
    } else {
      flattened[parent + key] = data[key]; // Assign flattened value with full key
    }
  }
  return flattened;
}

// Function to check if a sheet exists and create it if not
async function ensureSheetExists(sheetTitle) {
  try {
    const sheetResponse = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });

    const sheetsList = sheetResponse.data.sheets || [];
    const sheetExists = sheetsList.some(sheet => sheet.properties.title === sheetTitle);

    if (!sheetExists) {
      // Create the new sheet
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: sheetTitle,
                },
              },
            },
          ],
        },
      });
      console.log(`Sheet "${sheetTitle}" created.`);
    } else {
      console.log(`Sheet "${sheetTitle}" already exists.`);
    }
  } catch (error) {
    console.error("Error ensuring sheet existence:", error.message);
    throw new Error("Failed to ensure sheet existence.");
  }
}

// POST endpoint to save data to Google Sheets
app.post("/submit", async (req, res) => {
  const rawData = req.body;

  try {
    // Check if data contains the required fields
    if (!rawData || !rawData.form_title || Object.keys(rawData).length === 0) {
      console.error("Invalid data:", rawData);
      return res.status(400).send("Invalid data provided. Ensure 'form_title' is present.");
    }

    const sheetTitle = rawData.form_title; // Use form_title as the sheet name
    console.log("Received request for sheet:", sheetTitle);

    await ensureSheetExists(sheetTitle);
    console.log(`Sheet "${sheetTitle}" ensured.`);

    delete rawData.form_title; // Remove form_title from the data to prevent adding it to the rows

    const data = flattenData(rawData);
    const headers = Object.keys(data);
    const values = Object.values(data);

    console.log("Headers:", headers);
    console.log("Values:", values);

    // Check for existing headers
    const readResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetTitle}!A1:Z1`,
    });

    const existingHeaders = readResponse.data.values?.[0] || [];
    console.log("Existing Headers:", existingHeaders);

    // Add headers if they don't exist
    if (!existingHeaders.length) {
      console.log("Adding headers...");
      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: `${sheetTitle}!A1`,
        valueInputOption: "RAW",
        resource: { values: [headers] },
      });
    }

    // Append the new data
    console.log("Appending data...");
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetTitle}!A2`,
      valueInputOption: "RAW",
      resource: { values: [values] },
    });

    res.status(200).send(`Data saved to sheet "${sheetTitle}".`);
  } catch (error) {
    console.error("Error writing to Google Sheet:", error.message);
    res.status(500).send("Failed to save data.");
  }
});

// Start the server on port 3001
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));



