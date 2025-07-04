"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { 
    Search, Heart, Calendar, User, FileText, Home, Shield, Wrench, Briefcase, 
    Building, ArrowRight, CheckCircle, ScrollText, X 
} from 'lucide-react';

type UserRole = "buyer" | "tenant" | "landlord" | "manager" | "superadmin" | string;

interface TutorialModalProps {
    isOpen: boolean;
    onClose: () => void;
    userRole: UserRole;
}

interface TutorialStep {
    icon: React.ElementType;
    title: string;
    description: string;
}

const getTutorialSteps = (role: UserRole): TutorialStep[] => {
    switch (role) {
        case "buyer":
            return [
                { icon: Search, title: "Find Your Dream Property", description: "Use the 'Marketplace' or 'Search' to browse our extensive listings. Use filters to narrow down your perfect home." },
                { icon: Heart, title: "Save Your Favorites", description: "See a property you love? Click the heart icon to save it to your 'Favorites' dashboard for easy access later." },
                { icon: Calendar, title: "Schedule Visits & Inquire", description: "Interested in a property? You can schedule a visit or send a financial inquiry directly from the property details page." },
                { icon: User, title: "Manage Your Profile", description: "Keep your contact information up-to-date in your profile to ensure sellers and agents can reach you." },
            ];
        case "tenant":
            return [
                { icon: Search, title: "Find Your Next Rental", description: "Browse properties available for rent in the marketplace. Use filters to find places that match your needs." },
                { icon: FileText, title: "Submit Applications", description: "Easily apply to rent properties directly from their listing page. Track the status of all your applications in your dashboard." },
                { icon: Home, title: "Manage Your Residence", description: "Once your contract is active, you can view property details, request maintenance, and manage your lease from the 'Residences' tab." },
                { icon: Wrench, title: "Request Maintenance", description: "Something broken? Submit a detailed maintenance request directly to your property manager or landlord through the property details page." },
            ];
        case "landlord":
            return [
                { icon: User, title: "Complete Your Profile", description: "A complete profile with business details and a license builds trust. You must be an 'Approved' landlord to list properties." },
                { icon: Building, title: "List Your Properties", description: "Use the 'Add New Property' button to create detailed listings with photos, features, and amenities to attract buyers and renters." },
                { icon: FileText, title: "Review Applications", description: "Manage all incoming applications for your properties from your 'Applications' dashboard. Approve, reject, and even assign agents." },
                { icon: Shield, title: "Assign Agents", description: "When an agent applies to manage your property and you approve them, they will be automatically assigned to the listing." },
            ];
        case "manager":
            return [
                { icon: User, title: "Build Your Agent Profile", description: "Fill out your profile with your company info and license. Your status must be 'Approved' by an admin to manage properties." },
                { icon: Briefcase, title: "Find & Apply for Properties", description: "Browse the marketplace for properties listed by landlords and submit an application to become their managing agent." },
                { icon: FileText, title: "Manage Your Applications", description: "Track both your outgoing applications to landlords and incoming applications from potential tenants for properties you manage." },
                { icon: ScrollText, title: "Create & Manage Contracts", description: "Once a tenant's application is approved, you can create a legally binding rental contract directly from the applications page." },
            ];
        default:
            return [{ icon: CheckCircle, title: "Welcome!", description: "Explore your dashboard to manage your activities on the platform." }];
    }
}

const TutorialModal: React.FC<TutorialModalProps> = ({ isOpen, onClose, userRole }) => {
    const [dontShowAgain, setDontShowAgain] = useState(false);
    const tutorialSteps = getTutorialSteps(userRole);

    const handleClose = () => {
        if (dontShowAgain) {
            try {
                localStorage.setItem(`tutorial_seen_${userRole}`, 'true');
            } catch (error) {
                console.error("Could not save preference to local storage:", error);
            }
        }
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[600px] bg-white rounded-lg p-0 flex flex-col max-h-[90vh]">
                <DialogHeader className="p-6 border-b flex flex-row justify-between items-start">
                    <div>
                        <DialogTitle className="text-2xl font-bold text-gray-800">Welcome to Your Dashboard!</DialogTitle>
                        <p className="text-sm text-gray-500 mt-1">Here’s a quick guide to get you started as a {userRole}.</p>
                    </div>
                     <button
                        onClick={handleClose}
                        className="p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                        aria-label="Close"
                      >
                        <X size={20} />
                    </button>
                </DialogHeader>
                <div className="px-6 py-4 flex-1 overflow-y-auto space-y-6">
                    {tutorialSteps.map((step, index) => (
                        <div key={index} className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                <step.icon className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">{step.title}</h3>
                                <p className="text-gray-600 mt-1">{step.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
                <DialogFooter className="p-6 border-t bg-gray-50 sm:justify-between">
                    <div className="flex items-center space-x-2">
                        <Checkbox 
                            id="dont-show-again"
                            checked={dontShowAgain}
                            onCheckedChange={(checked) => setDontShowAgain(checked as boolean)}
                        />
                        <Label htmlFor="dont-show-again" className="text-sm font-medium text-gray-700 cursor-pointer">
                            Don&apos;t show this again
                        </Label>
                    </div>
                    <Button onClick={handleClose} className="bg-blue-600 hover:bg-blue-700">
                        Get Started <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default TutorialModal;