import logging
import azure.functions as func
import pandas as pd
import json
from azure.storage.blob import BlobServiceClient
import os



STORAGE_CONN_STRING = os.getenv("AZURE_STORAGE_CONNECTION_STRING")  
CONTAINER_NAME = os.getenv("BLOB_CONTAINER_NAME")                   
BLOB_NAME = os.getenv("BLOB_NAME")                                  


def main(req: func.HttpRequest) -> func.HttpResponse:
    logging.info("DietAnalysisFunction HTTP trigger processed a request.")

    try:
        # Connect to Azure Blob Storage
        blob_service_client = BlobServiceClient.from_connection_string(STORAGE_CONN_STRING)
        container_client = blob_service_client.get_container_client(CONTAINER_NAME)
        blob_client = container_client.get_blob_client(BLOB_NAME)

        # Download CSV as a string
        csv_bytes = blob_client.download_blob().readall()
        df = pd.read_csv(pd.io.common.BytesIO(csv_bytes))

        # === Prepare chart data ===
        # Bar chart: average Protein(g) per Diet_Type
        bar = df.groupby("Diet_type")["Protein(g)"].mean().reset_index()
        bar_data = {
            "labels": bar["Diet_type"].tolist(),
            "values": bar["Protein(g)"].round(2).tolist()
        }

        # Pie chart: count of recipes per Diet_Type
        pie = df["Diet_type"].value_counts()
        pie_data = {
            "labels": pie.index.tolist(),
            "values": pie.values.tolist()
        }

        # Scatter plot: Protein vs Carbs per recipe
        scatter_data = []
        for diet_type, group in df.groupby("Diet_type"):
            points = [{"x": row["Carbs(g)"], "y": row["Protein(g)"]} for idx, row in group.iterrows()]
            scatter_data.append({
                "label": diet_type,
                "points": points
            })

        # Heatmap: correlation matrix of Protein, Carbs, Fat
        corr = df[["Protein(g)", "Carbs(g)", "Fat(g)"]].corr()
        heatmap_data = {
            "labels": corr.columns.tolist(),
            "values": corr.values.round(2).tolist()
        }

        result = {
            "bar": bar_data,
            "pie": pie_data,
            "scatter": scatter_data,
            "heatmap": heatmap_data,
            "message": "Data fetched successfully"
        }

        return func.HttpResponse(json.dumps(result), mimetype="application/json", status_code=200)

    except Exception as e:
        logging.error(f"Error fetching data: {e}")
        return func.HttpResponse(
            json.dumps({"error": str(e)}),
            mimetype="application/json",
            status_code=500
        )
