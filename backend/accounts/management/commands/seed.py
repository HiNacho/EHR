from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from patients.models import Department, Patient, Admission, Vitals
from appointments.models import DoctorAvailability, Appointment
from clinical.models import Diagnosis, ClinicalNotes
from billing.models import Invoice
from messaging.models import MessageThread, Message
from datetime import datetime, timedelta
import random
from faker import Faker

User = get_user_model()
fake = Faker()

class Command(BaseCommand):
    help = 'Seeds the database with massive amounts of realistic EHR data'

    def handle(self, *args, **kwargs):
        self.stdout.write("Wiping old data and reseeding with Faker...")

        # Purge to keep it clean (CAUTION: Only for development)
        User.objects.all().delete()
        Department.objects.all().delete()

        # 1. Base Required Admin
        admin = User.objects.create_user(email="victor@hospital.com", username="victor", password="password123", role="ADMIN", first_name="Victor", last_name="Admin")


        # 2. 10 Realistic Departments
        dept_names = [
            "Internal Medicine", "Surgery", "Pediatrics", "Obstetrics & Gynecology", 
            "Emergency Medicine", "Orthopedics", "ENT", "Dermatology", "Psychiatry", "Ophthalmology"
        ]
        departments = []
        for name in dept_names:
            dept = Department.objects.create(name=name, description=fake.catch_phrase())
            departments.append(dept)

        # 3. Create Specific Doctors and Nurses
        doctors = []
        doctors.append(User.objects.create_user(email="john@hospital.com", username="dr.john", password="password123", role="DOCTOR", first_name="John", last_name="Doe"))
        doctors.append(User.objects.create_user(email="michael@hospital.com", username="dr.michael", password="password123", role="DOCTOR", first_name="Michael", last_name="Smith"))
        doctors.append(User.objects.create_user(email="scott@hospital.com", username="dr.scott", password="password123", role="DOCTOR", first_name="Scott", last_name="Johnson"))

        nurses = []
        nurses.append(User.objects.create_user(email="elizabeth@hospital.com", username="nurse.elizabeth", password="password123", role="NURSE", first_name="Elizabeth", last_name="Williams"))
        nurses.append(User.objects.create_user(email="jane@hospital.com", username="nurse.jane", password="password123", role="NURSE", first_name="Jane", last_name="Miller"))

        # 4. Doctor Availabilities
        for doc in doctors:
            for day in range(5):  # Mon-Fri
                DoctorAvailability.objects.create(
                    doctor=doc,
                    day_of_week=day,
                    start_time='09:00:00',
                    end_time='17:00:00'
                )

        # 5. Generate exactly 2 Patients
        patients = []
        p_user1 = User.objects.create_user(email="patient.alice@gmail.com", username="patient.alice", password="password123", role="PATIENT", first_name="Alice", last_name="Brown")
        patients.append(Patient.objects.create(
            linked_user=p_user1, full_name="Alice Brown", age=34, sex="F", hospital_id=fake.uuid4()[:10]
        ))
        
        p_user2 = User.objects.create_user(email="patient.bob@gmail.com", username="patient.bob", password="password123", role="PATIENT", first_name="Bob", last_name="Smith")
        patients.append(Patient.objects.create(
            linked_user=p_user2, full_name="Bob Smith", age=45, sex="M", hospital_id=fake.uuid4()[:10]
        ))
        
        for pat in patients:
            pat.departments.add(random.choice(departments))

        # 6. Sample Data (Admissions, Notes, Diagnoses, Appointments, Vitals)
        for pat in patients:
            # 20% chance of being admitted
            if random.random() > 0.8:
                Admission.objects.create(
                    patient=pat,
                    ward=random.choice(["General", "ICU", "Maternity", "Pediatric Ward"]),
                    bed_number=f"B-{random.randint(100,999)}",
                    status="ADMITTED"
                )

            # Generate Vitals (Time series - last 5 days)
            for i in range(5, 0, -1):
                Vitals.objects.create(
                    patient=pat,
                    recorded_by=random.choice(nurses + doctors),
                    temperature=round(random.uniform(36.1, 38.5), 1),
                    pulse=random.randint(60, 100),
                    blood_pressure=f"{random.randint(110, 140)}/{random.randint(70, 90)}",
                    respiratory_rate=random.randint(12, 20),
                    oxygen_saturation=random.randint(94, 100)
                )

            # Generate random Diagnosis and Clinical Notes
            Diagnosis.objects.create(
                patient=pat,
                doctor=random.choice(doctors),
                diagnosis_text=fake.sentence(nb_words=10)
            )
            for _ in range(random.randint(1, 4)):
                ClinicalNotes.objects.create(
                    patient=pat,
                    author=random.choice(doctors), # only doctors can author now (enforced by view, but good practice in seed)
                    note_text=fake.paragraph(nb_sentences=3)
                )

            # Generate random appointments with Telehealth mix
            for _ in range(random.randint(2, 5)):
                doc = random.choice(doctors)
                date = datetime.now().date() + timedelta(days=random.randint(-10, 10))
                time_choices = ['09:00:00', '10:00:00', '11:00:00', '14:00:00', '15:00:00']
                
                is_telehealth = random.choice([True, False])
                zoom_link = f"https://zoom.us/j/{random.randint(100000000,999999999)}" if is_telehealth else ""

                app_obj = Appointment.objects.create(
                    patient=pat,
                    doctor=doc,
                    department=random.choice(departments),
                    date=date,
                    time_slot=random.choice(time_choices),
                    status=random.choice(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED']),
                    reason=fake.catch_phrase(),
                    is_telehealth=is_telehealth,
                    zoom_link=zoom_link
                )
                
                # If completed or confirmed, drop an invoice
                if app_obj.status in ['COMPLETED', 'CONFIRMED']:
                    Invoice.objects.create(
                        patient=pat,
                        doctor=doc,
                        service_type=f"{'Telehealth' if is_telehealth else 'In-Person'} Consultation",
                        amount=random.choice([150.00, 250.00, 300.00, 500.00]),
                        status=random.choice(['PAID', 'PENDING', 'OVERDUE']),
                        due_date=date + timedelta(days=30),
                        paid_at=datetime.now() if random.choice([True, False]) else None
                    )

        # 7. Generate Strict Conversations Flow (10. DEMO BEHAVIOR)
        alice = patients[0].linked_user
        bob = patients[1].linked_user
        dr_john = doctors[0]
        dr_victor = doctors[1]
        dr_scott = doctors[2]
        nurse_eliza = nurses[0]
        nurse_jane = nurses[1]

        # Conversation 1: Alice to Dr. Victor
        t1 = MessageThread.objects.create(subject="Question regarding my prescription")
        t1.participants.add(alice, dr_victor)
        m = Message.objects.create(thread=t1, sender=alice, content="Hi Dr. Victor, my pharmacy said there's an issue with the script. Could you resend it?")
        m.read_by.add(alice)

        # Conversation 2: Bob to Dr. John
        t2 = MessageThread.objects.create(subject="Left Chest Pain")
        t2.participants.add(bob, dr_john)
        m = Message.objects.create(thread=t2, sender=bob, content="Dr. John, I had a sharp pain this morning while climbing stairs.")
        m.read_by.add(bob, dr_john)
        m2 = Message.objects.create(thread=t2, sender=dr_john, content="Bob, please come into the clinic immediately. If it worsens, visit the ER.")
        m2.read_by.add(dr_john)

        # Conversation 3: Doctor <-> Doctor
        t3 = MessageThread.objects.create(subject="Consultation: Patient Bob Smith")
        t3.participants.add(dr_john, dr_scott)
        m = Message.objects.create(thread=t3, sender=dr_john, content="Scott, could you review Bob's recent ECG? Trying to rule out pericarditis.")
        m.read_by.add(dr_john, dr_scott)

        # Conversation 4: Staff Group Chat (Pinned at top)
        t4 = MessageThread.objects.create(subject="🏥 Hospital Primary Staff Room", is_group_chat=True)
        t4.participants.add(admin, dr_john, dr_victor, dr_scott, nurse_eliza, nurse_jane)
        
        m_group1 = Message.objects.create(thread=t4, sender=admin, content="Welcome to the main hospital group chat. All staff updates will be posted here.")
        m_group1.read_by.add(admin, dr_john, dr_victor, dr_scott, nurse_eliza, nurse_jane)

        m_group2 = Message.objects.create(thread=t4, sender=nurse_eliza, content="Noted. ER beds are currently full, please advise before admitting today.")
        m_group2.read_by.add(nurse_eliza, nurse_jane, dr_john, dr_victor)

        self.stdout.write(self.style.SUCCESS('Successfully seeded Modular Messaging Architecture'))
