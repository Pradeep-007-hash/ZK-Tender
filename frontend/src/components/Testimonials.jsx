import React from 'react';
import { Star } from 'lucide-react';

const testimonials = [
  {
    quote: "Your feedback is good for all work related GeM product uploading support, bid participation.",
    name: "Vikas Rathod",
    company: "Marketing Executive, Tirupati Carbon Products Pvt. Ltd.",
    initials: "VR"
  },
  {
    quote: "Thanks for your support and Guidance in uploading the bid. We appreciate your cooperation in the process, luckily we have got the bid for all 5 bids.",
    name: "Vijay Kumar",
    company: "Managing Partner, Global Solutions",
    initials: "VK"
  },
  {
    quote: "We, Litmus India, wanted to take the time to thank you for the service your company provided to ours. We sincerely appreciate your customer service, how you're always available to handle any issues we are facing, and the professional way you conduct business. It's a pleasure associating with you.",
    name: "Pankaj Khanna",
    company: "Litmus India",
    initials: "PK"
  },
  {
    quote: "Thanks for your valuable support to upload products on GeM portal.",
    name: "Sayali S Shinde",
    company: "BluBoxx Communication Pvt. Ltd.",
    initials: "SS"
  },
  {
    quote: "We are, since last 6 months availing the support of C Net Technologies ZK-Tenders for submission of GEM bids and are happy to mention here that they are available and rendering timely support always. Honestly saying, we are very happy with their services.",
    name: "Mr. C BALASUBRAMANIAN",
    company: "General Manager, DVB TECHNOLOGIES PRIVATE LIMITED",
    initials: "CB"
  }
];

export default function Testimonials() {
  // Duplicate list to create a seamless infinite marquee slider loop
  const sliderItems = [...testimonials, ...testimonials];

  return (
    <section id="testimonials" className="section" style={{ background: '#F8FAFC', overflow: 'hidden' }}>
      <div className="container">
        <div className="section-header">
          <div className="section-badge">
            <Star size={16} /> CLIENT SUCCESS STORIES
          </div>
          <h2 className="section-title">Trusted by Industry Leaders Across India</h2>
          <p className="section-desc">Here is what marketing executives, managing partners, and general managers say about our GeM and tender services.</p>
        </div>

        {/* INFINITE RIGHT-TO-LEFT SLIDER */}
        <div className="testimonials-slider">
          <div className="testimonials-track">
            {sliderItems.map((t, idx) => (
              <div key={idx} className="testimonial-card">
                <div className="stars-row" style={{ display: 'flex', gap: '4px', color: '#F59E0B', marginBottom: '12px' }}>
                  <Star size={16} fill="#F59E0B" />
                  <Star size={16} fill="#F59E0B" />
                  <Star size={16} fill="#F59E0B" />
                  <Star size={16} fill="#F59E0B" />
                  <Star size={16} fill="#F59E0B" />
                </div>
                <p className="testimonial-quote">"{t.quote}"</p>
                <div className="testimonial-author">
                  <div className="author-avatar">{t.initials}</div>
                  <div>
                    <div className="author-name">{t.name}</div>
                    <div className="author-company">{t.company}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
