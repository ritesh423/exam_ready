import { Directory, File, Paths } from "expo-file-system";

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
  const directory = cardDirectory();
  directory.create({ idempotent: true, intermediates: true });
  const fileName = `${examId}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}.pdf`;
  await new File(pickedUri).copy(new File(directory, fileName));
  return fileName;
}

export function deleteAdmitCard(fileName: string): void {
  const file = getAdmitCardFile(fileName);
  if (file.exists) file.delete();
}
