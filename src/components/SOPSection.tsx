"use client";

import { useState } from "react";
import { type LocationData, encodeImagePath, getImageCacheKey } from "../lib/locationData";

interface SOPSectionProps {
  locationData: LocationData;
}

export function SOPSection({ locationData }: SOPSectionProps) {
  // Cache key for forcing image refresh when files change
  const cacheKey = getImageCacheKey();
  
  const [imageError, setImageError] = useState({
    qrAction: false,
    qrSummary: false,
    sop: false,
  });

  const handleImageError = (type: "qrAction" | "qrSummary" | "sop") => {
    setImageError((prev) => ({ ...prev, [type]: true }));
  };

  return (
    <div className="mt-8">
      {/* Action Plan Section Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 rounded-t-2xl px-6 py-8">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-3">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white">Action Plan Center</h2>
              <p className="text-blue-100 mt-1">Quick access to action plans and summaries</p>
            </div>
          </div>
        </div>
      </div>

      {/* QR Codes Container */}
      <div className="bg-white shadow-lg rounded-b-2xl p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* QR Action Plan */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 hover:shadow-lg transition-all duration-300 group">
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500 rounded-full opacity-20 group-hover:opacity-30 transition-opacity duration-300 blur-xl"></div>
                <div className="relative w-48 h-48 bg-white border-2 border-blue-200 rounded-xl shadow-md flex items-center justify-center">
                  {imageError.qrAction ? (
                    <div className="text-center p-4">
                      <div className="text-blue-400 mb-2">
                        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                        </svg>
                      </div>
                      <p className="text-sm text-gray-500">QR Code Tidak Tersedia</p>
                    </div>
                  ) : (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      key={`qr-action-${cacheKey}`}
                      src={encodeImagePath(locationData.qrActionPath)}
                      alt="QR Action Plan"
                      className="absolute inset-0 w-full h-full object-contain rounded-lg p-2"
                      onError={() => handleImageError("qrAction")}
                    />
                  )}
                </div>
              </div>
              <div className="w-full space-y-3">
                <h3 className="text-lg font-bold text-gray-800 text-center">Action Plan</h3>
                <a
                  href={locationData.actionPlanUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group/btn w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 text-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Access Action Plan
                </a>
              </div>
            </div>
          </div>

          {/* QR Summary Action Plan */}
          <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-xl p-6 hover:shadow-lg transition-all duration-300 group">
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <div className="absolute inset-0 bg-cyan-500 rounded-full opacity-20 group-hover:opacity-30 transition-opacity duration-300 blur-xl"></div>
                <div className="relative w-48 h-48 bg-white border-2 border-cyan-200 rounded-xl shadow-md flex items-center justify-center">
                  {imageError.qrSummary ? (
                    <div className="text-center p-4">
                      <div className="text-cyan-400 mb-2">
                        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                        </svg>
                      </div>
                      <p className="text-sm text-gray-500">QR Code Tidak Tersedia</p>
                    </div>
                  ) : (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      key={`qr-summary-${cacheKey}`}
                      src={encodeImagePath(locationData.qrSummaryPath)}
                      alt="QR Summary Action Plan"
                      className="absolute inset-0 w-full h-full object-contain rounded-lg p-2"
                      onError={() => handleImageError("qrSummary")}
                    />
                  )}
                </div>
              </div>
              <div className="w-full space-y-3">
                <h3 className="text-lg font-bold text-gray-800 text-center">Summary Action Plan</h3>
                <a
                  href={locationData.summaryPlanUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group/btn w-full bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 text-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  View Summary
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SOP Section Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl shadow-2xl">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full transform translate-x-32 -translate-y-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-5 rounded-full transform -translate-x-24 translate-y-24"></div>

        <div className="relative z-10 px-6 py-8">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-white/20 backdrop-blur-sm rounded-xl">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white">Standard Operating Procedure</h2>
              <p className="text-purple-100 mt-1">Guidelines and procedures for {locationData.locationName}</p>
            </div>
          </div>

          {/* Status Badge */}
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-white font-medium">Active Procedures</span>
          </div>
        </div>
      </div>

      {/* SOP Content */}
      <div className="bg-white shadow-xl rounded-b-2xl p-6">
        <div className="relative w-full h-auto min-h-[400px] bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl overflow-hidden">
          {/* Pattern Background */}
          <div className="absolute inset-0 opacity-5">
            <svg width="60" height="60" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
                  <path d="M 60 0 L 0 0 0 60" fill="none" stroke="gray" strokeWidth="1"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>

          <div className="relative p-8">
            {imageError.sop ? (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full mb-6">
                  <svg className="w-12 h-12 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">SOP Document Not Available</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  Please contact the administrator to add the SOP document for {locationData.locationName} location
                </p>
                <button className="mt-6 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-xl hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5">
                  Request SOP Document
                </button>
              </div>
            ) : (
              <div className="rounded-xl overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  key={`sop-${cacheKey}`}
                  src={encodeImagePath(locationData.sopImagePath)}
                  alt="Standard Operating Procedure"
                  className="w-full h-auto"
                  onError={() => handleImageError("sop")}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}