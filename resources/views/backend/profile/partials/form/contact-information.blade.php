<br>

<div class="form-group">
    <div class="fg-line">
      <label class="fg-label">Mobile Phone</label>
      <input type="text" class="form-control" name="phone" id="phone" value="{{ $data['phone'] }}" placeholder="Mobile Phone">
    </div>
</div>

<br>

<div class="form-group">
    <div class="fg-line">
      <label class="fg-label">Email Address</label>
      <input type="email" class="form-control" name="email" id="email" value="{{ $data['email'] }}" placeholder="Email Address">
    </div>
</div>

<br>

<div class="form-group">
    <div class="fg-line">
      <label class="fg-label">Address</label>
      <input type="text" class="form-control" name="address" id="address" value="{{ $data['address'] }}" placeholder="Address">
    </div>
</div>

<br>

<div class="form-group">
    <div class="fg-line">
      <label class="fg-label">City</label>
      <input type="text" class="form-control" name="city" id="city" value="{{ $data['city'] }}" placeholder="City">
    </div>
</div>

<br>

<div class="form-group">
    <div class="fg-line">
      <label class="fg-label">Country</label>
      <input type="text" class="form-control" name="country" id="country" value="{{ $data['country'] }}" placeholder="Country">
    </div>
</div>

@include('backend.profile.partials.modals.resume-help')