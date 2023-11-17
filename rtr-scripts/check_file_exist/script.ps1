#script check for file by path
# param(
#         [parameter(Mandatory)]
#         [string]$filePath
# )
$filePath = $args[0] | ConvertFrom-Json | Select -ExpandProperty 'filePath';

#grab deviceID from registry
$deviceID = "$(Get-ItemProperty HKLM:\SYSTEM\CurrentControlSet\Services\CSAgent\Sim | % AG | %{ "{0:x2}" -f $_ })" -replace " ",""

#create JSON Object
$jsonResponse = @{
  deviceID= "$deviceID"
  filePath= $filePath
} | ConvertTo-Json

# Test-Path to see if file exists
$fileExists = Test-Path -Path $filePath -PathType Leaf

#add file_exists?
$jsonResponse = $jsonResponse | ConvertFrom-Json
$jsonResponse | Add-Member -Type NoteProperty -Name 'file_exists' -Value $fileExists
$jsonResponse = $jsonResponse | ConvertTo-Json

Write-Output $jsonResponse