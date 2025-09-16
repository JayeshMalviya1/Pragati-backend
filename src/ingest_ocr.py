import os, json
import psycopg2
from psycopg2.extras import Json

DB = os.getenv('DATABASE_URL', 'postgres://prg_user:prg_password@localhost:5432/prg_db')

def ingest_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    # expected data format: { "file": "scan1.pdf", "fields": {...}, "text": "...", "claimant": {...} }
    conn = psycopg2.connect(DB)
    cur = conn.cursor()
    # insert document
    cur.execute("""
      INSERT INTO documents (filename, file_path, raw_text, structured, ocr_confidence, uploaded_by)
      VALUES (%s,%s,%s,%s,%s,%s) RETURNING id
    """, (
        data.get('file'),
        data.get('file_path'),
        data.get('text'),
        Json(data.get('fields')),
        data.get('confidence'),
        data.get('uploader','ocr-batch')
    ))
    doc_id = cur.fetchone()[0]

    # optionally create a claimant record if OCR extracted claimant details
    claimant = data.get('claimant')
    if claimant:
        geom = claimant.get('geometry')  # GeoJSON geometry or None
        if geom:
            cur.execute("""
              INSERT INTO claimants (name, claimant_type, tribal_group, village_id, area_ha, geom, properties)
              VALUES (%s,%s,%s,
                (SELECT id FROM villages WHERE name = %s LIMIT 1),
                %s, ST_SetSRID(ST_GeomFromGeoJSON(%s), 4326), %s)
            RETURNING id
            """, (
                claimant.get('name'), claimant.get('type'), claimant.get('tribe'),
                claimant.get('village'), claimant.get('area_ha'),
                json.dumps(geom), Json(claimant.get('properties', {}))
            ))
            claim_id = cur.fetchone()[0]
            # link doc to claimant
            cur.execute("UPDATE documents SET claimant_id = %s WHERE id = %s", (claim_id, doc_id))

    conn.commit()
    cur.close()
    conn.close()
    print("Ingested", path)

if __name__ == "__main__":
    folder = 'ocr_output'
    for fname in os.listdir(folder):
        if fname.endswith('.json'):
            ingest_file(os.path.join(folder, fname))
