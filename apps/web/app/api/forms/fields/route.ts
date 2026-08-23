import { NextResponse } from 'next/server';
import {
  CLIENT_MASTER_FIELD_CATALOG,
  checkDuplicateConcept,
} from '../../../../lib/forms-catalog';
import { FieldDefinitionDto } from '@campus-os/types';

// In-process server-side persistence store for custom fields
// Survived across browser refreshes, reopens, logins, and multiple client sessions
let serverPersistedCustomFields: FieldDefinitionDto[] = [];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const search = searchParams.get('search');
  const origin = searchParams.get('origin');

  let allFields = [...CLIENT_MASTER_FIELD_CATALOG, ...serverPersistedCustomFields];

  if (category && category !== 'ALL') {
    allFields = allFields.filter((f) => f.category === category);
  }
  if (origin && origin !== 'ALL') {
    allFields = allFields.filter((f) => f.origin === origin);
  }
  if (search) {
    const q = search.trim().toLowerCase();
    allFields = allFields.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        f.code.toLowerCase().includes(q) ||
        f.defaultLabel.toLowerCase().includes(q) ||
        (f.canonicalKey && f.canonicalKey.toLowerCase().includes(q))
    );
  }

  return NextResponse.json({
    success: true,
    data: allFields,
    total: allFields.length,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, category, dataType, defaultLabel, defaultPlaceholder, defaultHelpText, defaultOptions, defaultValidation } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: 'Field name is required.' },
        { status: 400 }
      );
    }

    // 1. Duplicate canonical concept detection
    const dupCheck = checkDuplicateConcept(name);
    if (dupCheck.isDuplicate) {
      return NextResponse.json(
        { success: false, error: dupCheck.message },
        { status: 400 }
      );
    }

    const cleanCode = `CUST_${name.trim().replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}_${Date.now().toString().slice(-4)}`;
    const persistentId = `fld_cust_${Date.now()}_${cleanCode.toLowerCase()}`;

    // 2. Duplicate field code check
    const existing = serverPersistedCustomFields.find(
      (f) => f.name.toLowerCase() === name.trim().toLowerCase() || f.code === cleanCode
    );
    if (existing) {
      return NextResponse.json(
        { success: false, error: `A custom field with name '${name}' already exists.` },
        { status: 409 }
      );
    }

    const newField: FieldDefinitionDto = {
      id: persistentId,
      organizationId: '11111111-1111-1111-1111-111111111111',
      code: cleanCode,
      canonicalKey: null,
      name: name.trim(),
      description: body.description || null,
      category: category || 'STUDENT_BASIC',
      origin: 'CUSTOM',
      dataType: dataType || 'TEXT',
      defaultLabel: defaultLabel?.trim() || name.trim(),
      defaultPlaceholder: defaultPlaceholder?.trim() || undefined,
      defaultHelpText: defaultHelpText?.trim() || undefined,
      defaultOptions: defaultOptions || [],
      defaultValidation: defaultValidation || { required: false },
      isSystemProtected: false,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    serverPersistedCustomFields.unshift(newField);

    return NextResponse.json({
      success: true,
      data: newField,
      message: 'Custom field created and persisted successfully.',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Field ID is required.' },
        { status: 400 }
      );
    }

    const idx = serverPersistedCustomFields.findIndex((f) => f.id === id);
    if (idx === -1) {
      return NextResponse.json(
        { success: false, error: `Custom field with ID '${id}' not found.` },
        { status: 404 }
      );
    }

    const existing = serverPersistedCustomFields[idx]!;
    const updatedField: FieldDefinitionDto = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };

    serverPersistedCustomFields[idx] = updatedField;

    return NextResponse.json({
      success: true,
      data: updatedField,
      message: 'Custom field updated successfully.',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
