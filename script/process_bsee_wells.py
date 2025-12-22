# script/process_bsee_wells.py
import pandas as pd
import os
import sys

def main():
    raw_dir = "data/raw/eWellAPDRawData"
    main_file = os.path.join(raw_dir, "mv_apd_main.txt")  # Common filename; adjust if needed

    if not os.path.exists(main_file):
        print(f"Error: Main APD file not found at {main_file}")
        print("Available files:", os.listdir(raw_dir))
        sys.exit(1)

    print("Loading APD data...")
    # Use sep='|' since it's pipe-delimited
    APD = pd.read_csv(main_file, sep=',', encoding='latin1', low_memory=False)

    # Convert all columns containing 'DATE' or 'DT' to datetime
    date_cols = [col for col in APD.columns if ('DATE' in col) or ('DT' in col)]
    print(f"Converting {len(date_cols)} date columns to datetime...")
    APD[date_cols] = APD[date_cols].apply(pd.to_datetime, errors='coerce')

    # Filter for wells approved on or after January 1, 2025
    print("Filtering for last 12 months-approved wells...")
    # Filter Only wells from the last 12 months from now
    current_date = pd.Timestamp.now()
    date_12_months_ago = current_date - pd.DateOffset(months=12)

    date_mask = (APD['APD_STATUS_DT'] > date_12_months_ago)
    # date_mask = APD['APD_STATUS_DT'] >= pd.to_datetime('2025-01-01')
    APD_2025 = APD[date_mask].copy()

    print(f"Found {len(APD_2025):,} wells approved in the last 12 months.")

    # Save to processed folder
    output_dir = "data/processed"
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, "gom_2025_wells.csv")

    APD_2025.to_csv(output_path, index=False)
    print(f"Saved filtered data to {output_path}")

    # Optional: Print summary
    if not APD_2025.empty:
        print("\nSample of 2025 wells:")
        print(APD_2025[['WELL_NAME', 'API_WELL_NUMBER', 'BUS_ASC_NAME', 'APD_STATUS_DT', 'WATER_DEPTH']].head())

if __name__ == "__main__":
    main()
