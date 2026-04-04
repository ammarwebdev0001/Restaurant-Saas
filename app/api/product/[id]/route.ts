import { CatProduct, PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

// Initialize Prisma client
const prisma = new PrismaClient();

// Handler function for PATCH request
export const PATCH = async (
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    const body = await request.json();

    // Update the product details and related product information
    const editProduct = await prisma.productStock.update({
      where: {
        id: String(id),
      },
      data: {
        name: body.productName,
        stock: body.stockProduct,
        price: body.buyPrice,
        cat: body.category as CatProduct,
        Product: {
          update: {
            where: {
              productId: String(id),
            },
            data: {
              sellprice: body.sellPrice,
            },
          },
        },
      },
      include: {
        Product: true,
      },
    });

    // Return the updated product in the response
    return NextResponse.json(editProduct, { status: 201 });
  } catch (error: any) {
    // Handle errors
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    // Disconnect Prisma client
    await prisma.$disconnect();
  }
};

// Handler function for DELETE request
export const DELETE = async (
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    // Delete the product with the specified id
    const product = await prisma.productStock.delete({
      where: {
        id: String(id),
      },
    });

    // Return a success message in the response
    return NextResponse.json(product, { status: 200 });
  } catch (error: any) {
    // Handle errors
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    // Disconnect Prisma client
    await prisma.$disconnect();
  }
};
