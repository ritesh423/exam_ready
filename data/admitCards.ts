import { Directory, File, Paths } from "expo-file-system";
import * as FileSystem from "expo-file-system/legacy";

const fileNamePattern = /^\d+-\d+-[a-z0-9]+\.pdf$/;

function cardDirectory() {
  return new Directory(Paths.document, "admit-cards");
}

export function getAdmitCardFile(fileName: string): File {
  if (!fileNamePattern.test(fileName)) {
    throw new Error("Invalid admit card file name");
  }
  return new File(cardDirectory(), fileName);
}

export async function copyAdmitCard(
  examId: number,
  pickedUri: string,
): Promise<string> {
  const root = FileSystem.documentDirectory;
  if (!root) throw new Error("Document storage is unavailable");

  const directoryUri = `${root}admit-cards/`;
  await FileSystem.makeDirectoryAsync(directoryUri, { intermediates: true });
  const fileName = `${examId}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}.pdf`;
  const destinationUri = `${directoryUri}${fileName}`;
  try {
    await FileSystem.copyAsync({ from: pickedUri, to: destinationUri });
    const savedFile = await FileSystem.getInfoAsync(destinationUri);
    if (!savedFile.exists || savedFile.isDirectory || savedFile.size === 0) {
      throw new Error("The copied PDF is empty or missing");
    }
  } catch (error) {
    try {
      await FileSystem.deleteAsync(destinationUri, { idempotent: true });
    } catch {
      // Keep the original copy error for the caller.
    }
    throw error;
  }
  return fileName;
}

export function deleteAdmitCard(fileName: string): void {
  const file = getAdmitCardFile(fileName);
  if (file.exists) file.delete();
}
