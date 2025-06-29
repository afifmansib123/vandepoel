"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import Loading from "@/components/Loading";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface MaintenanceProvider {
  _id: string;
  companyName: string;
  contactPerson?: string;
  email: string;
  phone?: string;
  servicesOffered: string[];
  serviceArea?: string;
  website?: string;
  status: 'active' | 'inactive';
}

const SuperadminMaintenancePage = () => {
  const [providers, setProviders] = useState<MaintenanceProvider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    companyName: "",
    contactPerson: "",
    email: "",
    phone: "",
    servicesOffered: "", // Comma-separated
    serviceArea: "",
    website: "",
  });

  const fetchProviders = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/superadmin/resources?resource=maintenance");
      if (!response.ok) throw new Error("Failed to fetch data.");
      const data = await response.json();
      setProviders(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
        const payload = {
            ...formData,
            servicesOffered: formData.servicesOffered.split(',').map(s => s.trim()).filter(s => s),
        };
      const response = await fetch("/api/superadmin/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || "Failed to add provider.");
      }
      setIsModalOpen(false);
      setFormData({ companyName: "", contactPerson: "", email: "", phone: "", servicesOffered: "", serviceArea: "", website: "" });
      fetchProviders();
      alert("Provider added successfully!");
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  if (isLoading) return <Loading />;
  if (error) return <div className="text-red-500 p-4">{error}</div>;

  return (
    <div className="dashboard-container">
      <div className="flex justify-between items-center mb-6">
        <Header title="Maintenance Services" subtitle="Manage maintenance provider partners." />
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
                <Button>Add New Provider</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add Maintenance Provider</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddProvider} className="space-y-4 pt-4">
                    <Input name="companyName" value={formData.companyName} placeholder="Company Name *" required onChange={handleInputChange} />
                    <Input name="contactPerson" value={formData.contactPerson} placeholder="Contact Person" onChange={handleInputChange} />
                    <Input name="email" value={formData.email} type="email" placeholder="Email *" required onChange={handleInputChange} />
                    <Input name="phone" value={formData.phone} type="tel" placeholder="Phone" onChange={handleInputChange} />
                    <Input name="serviceArea" value={formData.serviceArea} placeholder="Service Area (e.g., City, Postal Code)" onChange={handleInputChange} />
                    <Input name="website" value={formData.website} type="url" placeholder="https://website.com" onChange={handleInputChange} />
                    <Textarea name="servicesOffered" value={formData.servicesOffered} placeholder="Services Offered (comma-separated)" onChange={handleInputChange} />
                    <DialogFooter>
                        <Button type="submit">Add Provider</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
      </div>
      <div className="bg-white p-4 rounded-lg shadow-md overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Services</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {providers.map((p) => (
              <tr key={p._id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{p.companyName}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{p.email}<br/>{p.phone}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{p.servicesOffered.join(", ")}</td>
                <td className="px-6 py-4 whitespace-nowrap"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${p.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{p.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SuperadminMaintenancePage;