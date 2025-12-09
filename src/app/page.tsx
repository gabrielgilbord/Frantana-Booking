import BookingForm from '@/components/BookingForm';
import ContactSection from '@/components/ContactSection';

export default function Home() {
  return (
    <main className="min-h-screen">
      <section id="reservas">
        <BookingForm />
      </section>
      <ContactSection />
    </main>
  );
}