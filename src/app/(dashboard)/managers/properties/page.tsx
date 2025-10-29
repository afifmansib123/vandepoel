"use client";

// Remove the old Card import if it's no longer needed elsewhere or rename it
// import Card from "@/components/Card"; 
import PropertyCard, { Property } from "@/components/properyCard"; // Import the new card and Property type
import Header from "@/components/Header";
import Loading from "@/components/Loading";
import { useGetAuthUserQuery, useGetmanagerPropertiesQuery } from "@/state/api";
import React from "react";
import { useState , useEffect } from "react";
import Link from "next/link";

const ManagerProperties = () => {
  const {
    data: managerProperties, // Type assertion for better intellisense
    isLoading,
    isError,
  } = useGetmanagerPropertiesQuery() as { data: Property[] | undefined, isLoading: boolean, isError: boolean };

  const { data: authUser } = useGetAuthUserQuery()

  const [manager, setmanager] = useState<string>('')
  const [userproperties , setuserproperties] = useState<Property[]>([])

  useEffect(() => {
    if (authUser && authUser?.userRole === 'manager') {
      // Show properties where manager is the creator OR where they are assigned as the manager
      const managedProperties = managerProperties?.filter(
        (property) =>
          property.sellerCognitoId === authUser?.cognitoInfo.userId ||
          property.managedBy === authUser?.cognitoInfo.userId
      );
      setuserproperties(managedProperties || []);
    } else if (authUser && authUser?.userRole !== 'manager') {
      toast.error('You are not authorized to view this page. Please log in as a manager.');
    }
  },[authUser, managerProperties]);
  

  if (isLoading) return <Loading />;
  if (isError)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h2 className="text-2xl font-semibold text-red-600 mb-4">
            Error Loading Properties
          </h2>
          <p className="text-gray-700">
            We encountered an issue while trying to fetch your properties.
            Please check your connection and try again later.
          </p>
        </div>
      </div>
    );

  return (
    <div className="dashboard-container bg-gray-50 min-h-screen p-4 sm:p-6 lg:p-8"> {/* Added bg and padding */}
      <Header
        title="My Properties"
        subtitle="View and manage your property listings as a manager"
      />
      {userproperties && userproperties.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6"> {/* Adjusted xl breakpoint */}
          {userproperties.map((property) => (
            <PropertyCard
              key={property.id || property._id} // Use unique key
              property={property}
              propertyLink={`/managers/properties/${property.id}`}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-400 mb-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"/>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            No Properties Yet
          </h3>
                    <p className="text-gray-500 mb-6">
                      You haven’t listed any properties. Get started by adding <Link href="/managers/newproperty" className="text-blue-500 underline">here</Link>
                    </p>
          
        </div>
      )}
    </div>
  );
};

export default ManagerProperties;