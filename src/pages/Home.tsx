
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle, 
  Calendar, 
  CreditCard, 
  Clock, 
  User, 
  Shield, 
  ThumbsUp,
  ArrowRight 
} from 'lucide-react';

const Home = () => {
  const features = [
    {
      icon: Calendar,
      title: 'Easy Scheduling',
      description: 'Select from available time slots that work for your schedule'
    },
    {
      icon: CreditCard,
      title: 'Secure Payments',
      description: 'Pay online with our secure payment processing system'
    },
    {
      icon: Clock,
      title: 'Instant Confirmation',
      description: 'Receive immediate booking confirmation and reminders'
    }
  ];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Marketing Director',
      content: 'BookMaster made scheduling our company meetings so simple. The interface is intuitive and the payment process is seamless.',
      avatar: 'https://randomuser.me/api/portraits/women/32.jpg'
    },
    {
      name: 'Michael Chen',
      role: 'Software Engineer',
      content: "I've tried many booking systems, but this one stands out for its simplicity and reliability. Highly recommended!",
      avatar: 'https://randomuser.me/api/portraits/men/46.jpg'
    },
    {
      name: 'Emily Rodriguez',
      role: 'Small Business Owner',
      content: 'This platform saves me hours every week. My clients love how easy it is to book appointments with me.',
      avatar: 'https://randomuser.me/api/portraits/women/65.jpg'
    }
  ];

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-booking-light to-white py-16 md:py-24">
        <div className="booking-container">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl font-bold text-booking-primary leading-tight animate-fade-in">
                Kalu Cuts
              </h1>
              <p className="text-lg text-gray-600 animate-fade-in animate-delay-100">
                Book appointments online with ease. Our platform offers seamless scheduling, 
                secure payments, and instant confirmations.
              </p>
              <div className="pt-4 flex flex-col sm:flex-row gap-4 animate-fade-in animate-delay-200">
                <Link to="/booking">
                  <Button size="lg" className="bg-booking-primary hover:bg-opacity-90 text-white">
                    Book Now
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="lg" variant="outline" className="border-booking-primary text-booking-primary hover:bg-booking-accent">
                    Create Account
                  </Button>
                </Link>
              </div>
            </div>
            <div className="rounded-xl overflow-hidden shadow-2xl animate-fade-in">
              <img 
                src="https://images.unsplash.com/photo-1621605815971-fbc98d665033?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80" 
                alt="Booking illustration" 
                className="w-full h-auto object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-white">
        <div className="booking-container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-booking-primary mb-4">How It Works</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Our booking system is designed to make scheduling appointments as simple as possible.
              Follow these steps to get started.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="booking-card text-center">
              <div className="bg-booking-accent rounded-full w-14 h-14 flex items-center justify-center mx-auto mb-4">
                <User className="h-6 w-6 text-booking-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">1. Create Your Account</h3>
              <p className="text-gray-600">
                Sign up for a free account to access our booking system and manage your appointments.
              </p>
            </div>

            <div className="booking-card text-center">
              <div className="bg-booking-accent rounded-full w-14 h-14 flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-6 w-6 text-booking-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">2. Select Your Time Slot</h3>
              <p className="text-gray-600">
                Browse available time slots and select the one that works best for your schedule.
              </p>
            </div>

            <div className="booking-card text-center">
              <div className="bg-booking-accent rounded-full w-14 h-14 flex items-center justify-center mx-auto mb-4">
                <CreditCard className="h-6 w-6 text-booking-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">3. Pay and Confirm</h3>
              <p className="text-gray-600">
                Complete your booking with our secure payment system and receive instant confirmation.
              </p>
            </div>
          </div>

          <div className="text-center mt-12">
            <Link to="/booking">
              <Button className="bg-booking-primary hover:bg-opacity-90">
                <span>Get Started</span>
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

    {/* Features 
      <section className="py-16 bg-gray-50">
        <div className="booking-container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-booking-primary mb-4">Why Choose Our Platform</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Our booking system comes with powerful features designed to make the entire process smooth and efficient.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="booking-card">
                <feature.icon className="h-10 w-10 text-booking-primary mb-4" />
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    */}

      {/* Testimonials
      <section className="py-16 bg-white">
        <div className="booking-container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-booking-primary mb-4">What Our Users Say</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Don't just take our word for it. Here's what our users have to say about their experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="booking-card">
                <div className="flex items-center mb-4">
                  <img 
                    src={testimonial.avatar} 
                    alt={testimonial.name} 
                    className="w-12 h-12 rounded-full mr-4"
                  />
                  <div>
                    <h4 className="font-bold">{testimonial.name}</h4>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-gray-600 italic">"{testimonial.content}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>
     */}

      {/* CTA 
      <section className="py-16 bg-booking-primary text-white">
        <div className="booking-container text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Join thousands of satisfied users who have simplified their booking process.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/booking">
              <Button size="lg" className="bg-white text-booking-primary hover:bg-opacity-90">
                Book Now
              </Button>
            </Link>
            <Link to="/register">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-booking-primary hover:bg-opacity-80">
                Create Free Account
              </Button>
            </Link>
          </div>
        </div>
      </section>
    */}
    </div>
  );
};

export default Home;
