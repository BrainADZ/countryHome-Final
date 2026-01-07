/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from "express";
import { Types } from "mongoose";
import { User } from "../../models/User.model";

const getUserId = (req: Request) => (req as any).user?._id;

const trimStr = (v: any) => String(v ?? "").trim();

const ensureOneDefault = (addresses: any[], defaultId: string) => {
  for (const a of addresses) {
    a.isDefault = String(a._id) === String(defaultId);
  }
};

export const listAddresses = async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  const user = await User.findById(userId).select("addresses").lean();
  const addresses = user?.addresses || [];

  // if none default but have addresses -> make first default (self-heal)
  const hasDefault = addresses.some((a: any) => a.isDefault);
  if (!hasDefault && addresses.length) {
    await User.updateOne(
      { _id: userId, "addresses._id": addresses[0]._id },
      { $set: { "addresses.$.isDefault": true } }
    );
    const refreshed = await User.findById(userId).select("addresses").lean();
    return res.json({ message: "Addresses fetched", data: refreshed?.addresses || [] });
  }

  return res.json({ message: "Addresses fetched", data: addresses });
};

export const addAddress = async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  const fullName = trimStr(req.body.fullName);
  const phone = trimStr(req.body.phone);
  const pincode = trimStr(req.body.pincode);
  const state = trimStr(req.body.state);
  const city = trimStr(req.body.city);
  const addressLine1 = trimStr(req.body.addressLine1);
  const addressLine2 = trimStr(req.body.addressLine2);
  const landmark = trimStr(req.body.landmark);

  const makeDefault = Boolean(req.body.makeDefault);

  if (!fullName || !phone || !pincode || !state || !city || !addressLine1) {
    return res.status(400).json({
      message: "fullName, phone, pincode, state, city, addressLine1 are required",
    });
  }

  const user = await User.findById(userId).select("addresses");
  if (!user) return res.status(404).json({ message: "User not found" });

  const isFirst = (user.addresses?.length || 0) === 0;

  const newAddr: any = {
    _id: new Types.ObjectId(),
    fullName,
    phone,
    pincode,
    state,
    city,
    addressLine1,
    addressLine2: addressLine2 || undefined,
    landmark: landmark || undefined,
    isDefault: isFirst ? true : makeDefault,
  };

  // if making default, unset old default
  if (newAddr.isDefault) {
    for (const a of user.addresses as any) a.isDefault = false;
  }

  (user.addresses as any).push(newAddr);
  await user.save();

  return res.status(201).json({ message: "Address added", data: user.addresses });
};

export const updateAddress = async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  const { addressId } = req.params;
  if (!Types.ObjectId.isValid(addressId)) {
    return res.status(400).json({ message: "Invalid addressId" });
  }

  const user = await User.findById(userId).select("addresses");
  if (!user) return res.status(404).json({ message: "User not found" });

  const addr: any = (user.addresses as any).id(addressId);
  if (!addr) return res.status(404).json({ message: "Address not found" });

  // fields (only update if provided)
  const fields = [
    "fullName",
    "phone",
    "pincode",
    "state",
    "city",
    "addressLine1",
    "addressLine2",
    "landmark",
  ];

  for (const f of fields) {
    if (req.body[f] !== undefined) {
      const val = trimStr(req.body[f]);
      // required ones can't be empty if provided
      if (
        ["fullName", "phone", "pincode", "state", "city", "addressLine1"].includes(f) &&
        !val
      ) {
        return res.status(400).json({ message: `${f} cannot be empty` });
      }
      addr[f] = val || undefined;
    }
  }

  // default handling
  if (req.body.makeDefault === true) {
    ensureOneDefault(user.addresses as any, addressId);
  }

  await user.save();
  return res.json({ message: "Address updated", data: user.addresses });
};

export const setDefaultAddress = async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  const { addressId } = req.params;
  if (!Types.ObjectId.isValid(addressId)) {
    return res.status(400).json({ message: "Invalid addressId" });
  }

  const user = await User.findById(userId).select("addresses");
  if (!user) return res.status(404).json({ message: "User not found" });

  const addr: any = (user.addresses as any).id(addressId);
  if (!addr) return res.status(404).json({ message: "Address not found" });

  ensureOneDefault(user.addresses as any, addressId);
  await user.save();

  return res.json({ message: "Default address set", data: user.addresses });
};

export const deleteAddress = async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  const { addressId } = req.params;
  if (!Types.ObjectId.isValid(addressId)) {
    return res.status(400).json({ message: "Invalid addressId" });
  }

  const user = await User.findById(userId).select("addresses");
  if (!user) return res.status(404).json({ message: "User not found" });

  const addr: any = (user.addresses as any).id(addressId);
  if (!addr) return res.status(404).json({ message: "Address not found" });

  const wasDefault = Boolean(addr.isDefault);

  addr.deleteOne();
  await user.save();

  // if deleted default, set first remaining as default
  if (wasDefault) {
    const fresh = await User.findById(userId).select("addresses");
    if (fresh && (fresh.addresses as any).length) {
      (fresh.addresses as any)[0].isDefault = true;
      await fresh.save();
      return res.json({ message: "Address deleted", data: fresh.addresses });
    }
  }

  const refreshed = await User.findById(userId).select("addresses").lean();
  return res.json({ message: "Address deleted", data: refreshed?.addresses || [] });
};
