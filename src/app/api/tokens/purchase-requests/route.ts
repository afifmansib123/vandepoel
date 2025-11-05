import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/utils/dbConnect";
import TokenPurchaseRequest from "@/app/models/TokenPurchaseRequest";
import PropertyToken from "@/app/models/PropertyToken";
import SellerProperty from "@/app/models/SellerProperty";
import Location from "@/app/models/Location";
import Buyer from "@/app/models/Buyer";
import Landlord from "@/app/models/Landlord";
import { getUserFromToken } from "@/lib/auth";
import { createNotification, TokenNotificationMessages } from "@/lib/notifications";

/**
 * GET /api/tokens/purchase-requests
 * List token purchase requests
 * - Buyers see their own requests
 * - Sellers see requests for their properties
 */
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status"); // Filter by status
    const role = searchParams.get("role"); // 'buyer' or 'seller'

    const skip = (page - 1) * limit;

    // Build filter based on user role
    let filter: any = {};

    if (role === "buyer" || !role) {
      // Buyers see:
      // 1. Requests where they are the buyer
      // 2. P2P requests where they are the seller (someone buying from their listing)
      filter.$or = [
        { buyerId: user.userId },           // Their purchase requests
        { sellerId: user.userId }           // P2P sales (they listed tokens)
      ];
    } else if (role === "seller") {
      // Sellers see requests for their properties AND P2P requests where they are the seller
      // 1. Find properties owned by this seller (official token sales)
      const sellerProperties = await SellerProperty.find({
        sellerCognitoId: user.userId,
      }).select("_id");

      const propertyIds = sellerProperties.map((p) => p._id);

      // 2. Include both: properties they own OR where they are the P2P seller
      filter.$or = [
        { propertyId: { $in: propertyIds } },  // Official sales (landlord owns property)
        { sellerId: user.userId }               // P2P sales (buyer is seller)
      ];
    }

    // Add status filter if provided
    if (status) {
      filter.status = status;
    }

    // Fetch requests with property and token offering details
    const requests = await TokenPurchaseRequest.find(filter)
      .populate({
        path: "propertyId",
        select: "title location price images propertyType",
      })
      .populate({
        path: "tokenOfferingId",
        select: "tokenName tokenSymbol tokenPrice totalTokens tokensSold",
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await TokenPurchaseRequest.countDocuments(filter);

    return NextResponse.json({
      success: true,
      data: requests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("Error fetching token purchase requests:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch requests" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tokens/purchase-requests
 * Submit a new token purchase request
 *
 * Body:
 * - tokenOfferingId: string
 * - tokensRequested: number
 * - message?: string
 * - proposedPaymentMethod: string
 * - investmentPurpose?: string
 * - buyerPhone?: string
 * - buyerAddress?: string
 */
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      tokenOfferingId,
      tokensRequested,
      message,
      proposedPaymentMethod,
      investmentPurpose,
      buyerPhone,
      buyerAddress,
    } = body;

    // Validate required fields
    if (!tokenOfferingId || !tokensRequested || !proposedPaymentMethod) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing required fields: tokenOfferingId, tokensRequested, proposedPaymentMethod",
        },
        { status: 400 }
      );
    }

    // Fetch token offering with property populated
    const tokenOffering = await PropertyToken.findById(tokenOfferingId).populate("propertyId");
    if (!tokenOffering) {
      return NextResponse.json(
        { success: false, message: "Token offering not found" },
        { status: 404 }
      );
    }

    // Check if offering is active
    if (tokenOffering.status !== "active") {
      return NextResponse.json(
        { success: false, message: "Token offering is not active" },
        { status: 400 }
      );
    }

    // Check token availability
    const availableTokens = tokenOffering.totalTokens - tokenOffering.tokensSold;
    if (tokensRequested > availableTokens) {
      return NextResponse.json(
        {
          success: false,
          message: `Only ${availableTokens} tokens available`,
        },
        { status: 400 }
      );
    }

    // Check min/max limits
    if (tokensRequested < tokenOffering.minPurchase) {
      return NextResponse.json(
        {
          success: false,
          message: `Minimum purchase is ${tokenOffering.minPurchase} tokens`,
        },
        { status: 400 }
      );
    }

    if (tokensRequested > tokenOffering.maxPurchase) {
      return NextResponse.json(
        {
          success: false,
          message: `Maximum purchase is ${tokenOffering.maxPurchase} tokens`,
        },
        { status: 400 }
      );
    }

    // Get property
    const property = tokenOffering.propertyId;
    if (!property) {
      return NextResponse.json(
        { success: false, message: "Property not found" },
        { status: 404 }
      );
    }

    // Fetch buyer information from Buyer model
    const buyer = await Buyer.findOne({ cognitoId: user.userId });
    if (!buyer) {
      return NextResponse.json(
        { success: false, message: "Buyer profile not found" },
        { status: 404 }
      );
    }

    // Fetch seller information from Landlord model
    const seller = await Landlord.findOne({ cognitoId: property.sellerCognitoId });
    if (!seller) {
      return NextResponse.json(
        { success: false, message: "Seller profile not found" },
        { status: 404 }
      );
    }

    // Fetch location to determine currency
    let currency: "EUR" | "THB" = "EUR"; // Default to EUR
    if (property.locationId) {
      const location = await Location.findOne({ id: property.locationId });
      if (location?.country) {
        const country = location.country.toLowerCase();
        if (country.includes("thailand") || country === "th") {
          currency = "THB";
        }
      }
    }

    // Calculate total amount
    const totalAmount = tokensRequested * tokenOffering.tokenPrice;

    // Get latest request ID (auto-incremented in pre-save hook, but we can set it manually too)
    const latestRequest = await TokenPurchaseRequest.findOne().sort({ requestId: -1 });
    const requestId = latestRequest ? latestRequest.requestId + 1 : 1000;

    // Create purchase request
    const purchaseRequest = await TokenPurchaseRequest.create({
      requestId,
      tokenOfferingId,
      propertyId: property._id,
      // Buyer info from Buyer model
      buyerId: buyer.cognitoId,
      buyerName: buyer.name,
      buyerEmail: buyer.email,
      buyerPhone: buyerPhone || buyer.phoneNumber,
      buyerAddress,
      // Seller info from Landlord model
      sellerId: seller.cognitoId,
      sellerName: seller.name,
      sellerEmail: seller.email,
      // Token details
      tokensRequested,
      pricePerToken: tokenOffering.tokenPrice,
      totalAmount,
      currency,
      // Request details
      message,
      proposedPaymentMethod,
      investmentPurpose,
      status: "pending",
      agreementSignedByBuyer: false,
      agreementSignedBySeller: false,
    });

    // Populate the response
    const populatedRequest = await TokenPurchaseRequest.findById(purchaseRequest._id)
      .populate({
        path: "propertyId",
        select: "title location price images propertyType",
      })
      .populate({
        path: "tokenOfferingId",
        select: "tokenName tokenSymbol tokenPrice totalTokens tokensSold",
      });

    // Send notification to seller
    const notificationMessage = TokenNotificationMessages.REQUEST_SUBMITTED(
      buyer.name,
      tokensRequested,
      property.name
    );
    await createNotification({
      userId: seller.cognitoId,
      type: 'token_request',
      title: notificationMessage.title,
      message: notificationMessage.message,
      relatedId: purchaseRequest._id.toString(),
      relatedUrl: `/landlords/token-requests`,
      priority: 'high',
    });

    return NextResponse.json({
      success: true,
      message: "Purchase request submitted successfully",
      data: populatedRequest,
    });
  } catch (error: any) {
    console.error("Error creating token purchase request:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to create purchase request" },
      { status: 500 }
    );
  }
}
