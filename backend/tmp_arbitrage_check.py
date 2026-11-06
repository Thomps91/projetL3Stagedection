import json
import urllib.request

from app.db.database import SessionLocal
from app.models.models import UploadedFileModel, DataRecordModel, MatchPairModel


db = SessionLocal()
try:
    fa = UploadedFileModel(
        name='a.csv',
        size='1 Ko',
        size_bytes=1024,
        format='CSV',
        row_count=1,
        upload_date='2024-01-01',
    )
    fb = UploadedFileModel(
        name='b.csv',
        size='1 Ko',
        size_bytes=1024,
        format='CSV',
        row_count=1,
        upload_date='2024-01-01',
    )
    db.add_all([fa, fb])
    db.flush()

    r1 = DataRecordModel(
        nom='Dupont',
        prenom='Jean',
        email='jean@test.fr',
        telephone='0123456789',
        adresse='1 rue A',
        ville='Paris',
        source_file='a.csv',
        file_id=fa.id,
    )
    r2 = DataRecordModel(
        nom='Dupond',
        prenom='Jean',
        email='jean@test.fr',
        telephone='0123456789',
        adresse='1 rue A',
        ville='Paris',
        source_file='b.csv',
        file_id=fb.id,
    )
    db.add_all([r1, r2])
    db.flush()

    m = MatchPairModel(
        record_a_id=r1.id,
        record_b_id=r2.id,
        score=78,
        status='uncertain',
        status_label='Cas incertain',
    )
    db.add(m)
    db.commit()
    db.refresh(m)
    print('match_id=' + m.id)

    payload = json.dumps({'decision': 'confirmed'}).encode()
    req = urllib.request.Request(
        f'http://127.0.0.1:8000/api/arbitration/{m.id}',
        data=payload,
        headers={'Content-Type': 'application/json'},
        method='POST',
    )

    with urllib.request.urlopen(req, timeout=30) as resp:
        print('status=' + str(resp.status))
        print(resp.read().decode())

    saved = db.get(MatchPairModel, m.id)
    print('saved_decision=' + str(saved.decision))
    print('saved_decision_date=' + str(saved.decision_date))
finally:
    db.close()
