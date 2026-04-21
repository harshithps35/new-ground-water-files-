$kmlPath = "D:\new ground water files'\data\borewells.kml"
$jsonPath = "D:\new ground water files'\backend\data\borewells.json"

[xml]$kml = Get-Content $kmlPath
$placemarks = $kml.kml.Document.Placemark

# BBMP Zone boundaries (approximate lat/lng centroids)
function Get-Zone($lat, $lng) {
    if ($lat -gt 13.05 -and $lng -lt 77.55) { return "Dasarahalli" }
    if ($lat -gt 13.05 -and $lng -ge 77.55) { return "Yelahanka" }
    if ($lat -gt 12.98 -and $lat -le 13.05 -and $lng -lt 77.55) { return "RR Nagar" }
    if ($lat -gt 12.98 -and $lat -le 13.05 -and $lng -ge 77.55 -and $lng -lt 77.62) { return "West" }
    if ($lat -gt 12.98 -and $lat -le 13.05 -and $lng -ge 77.62) { return "Mahadevapura" }
    if ($lat -gt 12.92 -and $lat -le 12.98 -and $lng -lt 77.55) { return "South" }
    if ($lat -gt 12.92 -and $lat -le 12.98 -and $lng -ge 77.55 -and $lng -lt 77.62) { return "East" }
    if ($lat -gt 12.92 -and $lat -le 12.98 -and $lng -ge 77.62) { return "Mahadevapura" }
    if ($lat -le 12.92 -and $lng -lt 77.58) { return "Bommanahalli" }
    if ($lat -le 12.92 -and $lng -ge 77.58) { return "Bommanahalli" }
    return "Other"
}

$borewells = foreach ($p in $placemarks) {
    $coords = $p.Point.coordinates.Split(',')
    $extData = $p.ExtendedData.SchemaData.SimpleData
    
    $id = ($extData | Where-Object { $_.name -eq "Borewell_ID" })."#text"
    $pipe = ($extData | Where-Object { $_.name -eq "PipeType" })."#text"
    $pump = ($extData | Where-Object { $_.name -eq "PumpType" })."#text"
    $ssid = ($extData | Where-Object { $_.name -eq "SSID" })."#text"
    
    if ($coords.Count -ge 2) {
        $lat = [double]$coords[1]
        $lng = [double]$coords[0]
        $zone = Get-Zone $lat $lng
        
        [PSCustomObject]@{
            id   = if ($id) { $id } else { "N/A" }
            lng  = $lng
            lat  = $lat
            pipe = if ($pipe) { $pipe } else { "N/A" }
            pump = if ($pump) { $pump } else { "N/A" }
            ssid = if ($ssid) { [int]$ssid } else { 0 }
            zone = $zone
            status = "Working"
        }
    }
}

$borewells | ConvertTo-Json -Depth 10 | Out-File $jsonPath -Encoding utf8
Write-Host "Converted $($borewells.Count) borewells to JSON"
$borewells | Group-Object zone | Select Name, Count | Sort Count -Descending
