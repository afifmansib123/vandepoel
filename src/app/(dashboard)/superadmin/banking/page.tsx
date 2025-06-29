"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import Loading from "@/components/Loading";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface BankingService {
  _id: string;
  bankName: string;
  contactPerson?: string;
  email: string;
  phone?: string;
  servicesOffered: string[];
  website?: string;
}

const SuperadminBankingPage = () => {
  const [services, setServices] = useState<BankingService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    bankName: "",
    contactPerson: "",
    email: "",
    phone: "",
    servicesOffered: "", // Comma-separated
    website: "",
  });

  const fetchServices = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/superadmin/resources?resource=banking");
      if (!response.ok) throw new Error("Failed to fetch data.");
      const data = await response.json();
      setServices(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
        const payload = {
            ...formData,
            servicesOffered: formData.servicesOffered.split(',').map(s => s.trim()).filter(s => s),
        };
      const response = await fetch("/api/superadmin/banking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || "Failed to add service.");
      }
      setIsModalOpen(false);
      setFormData({ bankName: "", contactPerson: "", email: "", phone: "", servicesOffered: "", website: "" });
      fetchServices();
      alert("Banking service added successfully!");
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  if (isLoading) return <Loading />;
  if (error) return <div className="text-red-500 p-4">{error}</div>;

  return (
    <div className="dashboard-container">
      <div className="flex justify-between items-center mb-6">
        <Header title="Banking Services" subtitle="Manage banking and financial partners." />
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
                <Button>Add New Service</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add Banking Service</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddService} className="space-y-4 pt-4">
                    <Input name="bankName" value={formData.bankName} placeholder="Bank Name *" required onChange={handleInputChange} />
                    <Input name="contactPerson" value={formData.contactPerson} placeholder="Contact Person" onChange={handleInputChange} />
                    <Input name="email" value={formData.email} type="email" placeholder="Email *" required onChange={handleInputChange} />
                    <Input name="phone" value={formData.phone} type="tel" placeholder="Phone" onChange={handleInputChange} />
                    <Input name="website" value={formData.website} type="url" placeholder="https://website.com" onChange={handleInputChange} />
                    <Textarea name="servicesOffered" value={formData.servicesOffered} placeholder="Services Offered (e.g. Mortgage, Pre-approval)" onChange={handleInputChange} />
                    <DialogFooter>
                        <Button type="submit">Add Service</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
      </div>
      <div className="bg-white p-4 rounded-lg shadow-md overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bank Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Services</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {services.map((s) => (
              <tr key={s._id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{s.bankName}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{s.email}<br/>{s.phone}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{s.servicesOffered.join(", ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SuperadminBankingPage;